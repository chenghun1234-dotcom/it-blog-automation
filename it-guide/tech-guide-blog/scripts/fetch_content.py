#!/usr/bin/env python3
"""
블로그 콘텐츠 자동화 파이프라인
1. 데이터 수집 (Hacker News, Dev.to)
2. AI 재작성 (Google Gemini API)
3. 배포 (Next.js 정적 마크다운, 또는 Blogger API)
"""

import json
import os
import requests
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def safe_log_text(text: str) -> str:
    try:
        return text.encode('cp949', errors='replace').decode('cp949')
    except Exception:
        return text


class ContentCollector:
    """데이터 수집 모듈"""
    
    def __init__(self):
        self.hn_url = "https://hacker-news.firebaseio.com/v0"
        self.devto_url = "https://dev.to/api"
        self.timeout = 10
    
    def get_hackernews(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Hacker News 인기글 수집
        
        Args:
            limit: 수집할 글의 개수
        
        Returns:
            글 정보 리스트
        """
        try:
            logger.info(f"Hacker News 수집 시작... (limit={limit})")
            
            # 인기글 ID 목록
            top_stories_response = requests.get(
                f"{self.hn_url}/topstories.json",
                timeout=self.timeout
            )
            story_ids = top_stories_response.json()[:limit]
            
            stories = []
            
            for i, story_id in enumerate(story_ids):
                try:
                    item_response = requests.get(
                        f"{self.hn_url}/item/{story_id}.json",
                        timeout=self.timeout
                    )
                    item = item_response.json()
                    
                    if item and item.get('type') == 'story':
                        stories.append({
                            'source': 'hackernews',
                            'title': item.get('title', '제목 없음'),
                            'url': item.get('url', f"https://news.ycombinator.com/item?id={story_id}"),
                            'score': item.get('score', 0),
                            'author': item.get('by', 'Anonymous'),
                            'time': item.get('time', datetime.now().timestamp()),
                            'summary': f"Hacker News 트렌드: {item.get('title', '')}",
                        })
                        title_preview = safe_log_text(item.get('title', '')[:50])
                        logger.info(f"  [OK] [{i+1}/{limit}] {title_preview}...")
                
                except Exception as e:
                    logger.warning(f"  ✗ 아이템 {story_id} 수집 실패: {e}")
                    continue
            
            logger.info(f"[DONE] Hacker News 수집 완료: {len(stories)}개")
            return stories
        
        except Exception as e:
            logger.error(f"Hacker News 수집 실패: {e}")
            return []
    
    def get_devto(self, tag: str = 'javascript', limit: int = 3) -> List[Dict[str, Any]]:
        """
        Dev.to 아티클 수집 (body_markdown 포함)
        
        Args:
            tag: 검색 태그
            limit: 수집할 아티클 개수
        
        Returns:
            아티클 정보 리스트
        """
        try:
            logger.info(f"Dev.to 수집 시작... (tag={tag}, limit={limit})")
            
            # 아티클 목록
            list_response = requests.get(
                f"{self.devto_url}/articles",
                params={
                    'tag': tag,
                    'per_page': limit,
                    'state': 'fresh'
                },
                timeout=self.timeout
            )
            article_list = list_response.json()
            
            articles = []
            
            for i, article in enumerate(article_list):
                try:
                    # 상세 정보 (body_markdown 포함)
                    detail_response = requests.get(
                        f"{self.devto_url}/articles/{article['id']}",
                        timeout=self.timeout
                    )
                    detail = detail_response.json()
                    
                    articles.append({
                        'source': 'devto',
                        'title': detail.get('title', '제목 없음'),
                        'url': detail.get('url', ''),
                        'description': detail.get('description', ''),
                        'body_markdown': detail.get('body_markdown', ''),
                        'author': detail.get('user', {}).get('name', 'Unknown'),
                        'reading_time': detail.get('reading_time_minutes', 5),
                        'reactions': detail.get('reactions_count', 0),
                        'published_at': detail.get('published_at', datetime.now().isoformat()),
                    })
                    title_preview = safe_log_text(detail.get('title', '')[:50])
                    logger.info(f"  [OK] [{i+1}/{len(article_list)}] {title_preview}...")
                
                except Exception as e:
                    logger.warning(f"  ✗ 아티클 {article.get('id')} 수집 실패: {e}")
                    continue
            
            logger.info(f"[DONE] Dev.to 수집 완료: {len(articles)}개")
            return articles
        
        except Exception as e:
            logger.error(f"Dev.to 수집 실패: {e}")
            return []
    
    def save_data(self, data: Dict[str, Any], filename: str = 'collected_data.json') -> bool:
        """수집 데이터 저장"""
        try:
            output_path = Path('scripts') / filename
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"[DONE] 데이터 저장 완료: {output_path}")
            return True
        
        except Exception as e:
            logger.error(f"데이터 저장 실패: {e}")
            return False


class ContentProcessor:
    """AI 콘텐츠 처리 모듈"""
    
    def __init__(self, api_key: str = None):
        """
        Args:
            api_key: Google Gemini API 키 (없으면 환경변수 사용)
        """
        try:
            import google.generativeai as genai
            
            self.api_key = api_key or os.getenv('GEMINI_API_KEY')
            if not self.api_key:
                logger.warning("⚠️  GEMINI_API_KEY 환경변수가 설정되지 않았습니다")
                self.genai = None
            else:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                self.genai = genai
        except ImportError:
            logger.warning("⚠️  google-generativeai 모듈이 설치되지 않았습니다")
            logger.warning("   설치: pip install google-generativeai")
            self.genai = None
    
    def rewrite_content(self, content: str, title: str, source: str = 'unknown') -> Dict[str, str]:
        """
        AI로 콘텐츠 재작성
        
        Args:
            content: 원본 콘텐츠
            title: 원본 제목
            source: 콘텐츠 출처
        
        Returns:
            재작성된 콘텐츠 정보
        """
        if not self.genai:
            logger.warning("Gemini API 미설정 - 원본 콘텐츠 반환")
            return {
                'title': title,
                'korean_content': content,
                'status': 'original',
                'source': source
            }
        
        try:
            logger.info(f"AI 재작성 중: {safe_log_text(title[:50])}...")
            
            prompt = f"""당신은 전문 기술 블로거입니다.
다음 원본 콘텐츠를 바탕으로 새로운 한국어 기술 포스트를 작성해주세요.

요구사항:
1. 기계적 표현 제거 (예: "이 가이드에서는", "알아보겠습니다" 금지)
2. 실제 프로젝트 경험 추가 (예: "지난 프로젝트에서...")
3. 친근하지만 전문적인 톤
4. 코드 예제는 실행 가능한 형태로 유지
5. 마크다운 형식 유지
6. 800-1500단어 목표

원본 제목: {title}
원본 출처: {source}

원본 콘텐츠 (처음 2000자):
{content[:2000]}

한국어 포스트 작성:
"""
            
            response = self.model.generate_content(prompt)
            
            logger.info("  [OK] 재작성 완료")
            
            return {
                'title': title,
                'korean_content': response.text,
                'status': 'rewritten',
                'source': source
            }
        
        except Exception as e:
            logger.error(f"AI 재작성 실패: {e}")
            return {
                'title': title,
                'korean_content': content,
                'status': 'error',
                'source': source
            }
    
    def generate_seo_meta(self, title: str, content: str) -> Dict[str, Any]:
        """SEO 메타 데이터 생성"""
        if not self.genai:
            logger.warning("Gemini API 미설정 - 기본 메타데이터 반환")
            return {
                'seo_title': title[:60],
                'seo_description': content[:160],
                'keywords': ['기술', '블로그'],
                'status': 'default'
            }
        
        try:
            logger.info(f"SEO 메타 생성 중: {safe_log_text(title[:50])}...")
            
            seo_prompt = f"""
다음 블로그 제목과 일부 내용을 보고 SEO 최적화된 메타 데이터를 JSON 형식으로 생성하세요.

제목: {title}
내용: {content[:500]}

JSON 형식 (유효한 JSON만 반환):
{{
    "seo_title": "검색 최적화 제목 (50-60자)",
    "seo_description": "메타 설명 (120-160자)",
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "og_title": "소셜 미디어 제목",
    "og_description": "소셜 미디어 설명"
}}
"""
            
            response = self.model.generate_content(seo_prompt)
            
            # JSON 파싱 시도
            try:
                import json as json_lib
                return json_lib.loads(response.text)
            except:
                # 파싱 실패 시 기본값
                return {
                    'seo_title': title[:60],
                    'seo_description': content[:160],
                    'keywords': ['기술', '블로그'],
                    'status': 'parse_error'
                }
        
        except Exception as e:
            logger.error(f"SEO 메타 생성 실패: {e}")
            return {
                'seo_title': title[:60],
                'seo_description': content[:160],
                'keywords': ['기술', '블로그'],
                'status': 'error'
            }


class ContentPublisher:
    """콘텐츠 배포 모듈"""
    
    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path('.')
        self.posts_dir = self.project_root / 'public' / 'posts'
    
    def publish_to_markdown(self, post: Dict[str, Any]) -> bool:
        """Next.js 정적 마크다운으로 발행"""
        try:
            # 파일명 생성
            slug = post['title'].lower().replace(' ', '-')[:50]
            slug = ''.join(c for c in slug if c.isalnum() or c in '-_')
            filename = f"{datetime.now().strftime('%Y%m%d')}-{slug}.md"
            filepath = self.posts_dir / filename
            
            # 마크다운 콘텐츠 생성
            content = f"""# {post['title']}

> 원본 출처: {post.get('source', 'unknown')}
> 발행 일시: {datetime.now().strftime('%Y-%m-%d %H:%M')}

{post.get('korean_content', post.get('body_markdown', ''))}
"""
            
            self.posts_dir.mkdir(parents=True, exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"[DONE] 마크다운 발행: {filepath}")
            return True
        
        except Exception as e:
            logger.error(f"마크다운 발행 실패: {e}")
            return False
    
    def publish_all(self, posts: List[Dict[str, Any]]) -> int:
        """모든 포스트 발행"""
        count = 0
        for post in posts:
            if self.publish_to_markdown(post):
                count += 1
        
        logger.info(f"\n[DONE] 총 {count}/{len(posts)}개 포스트 발행 완료!")
        return count


def main():
    """메인 실행 함수"""

    logger.info("=" * 60)
    logger.info("블로그 콘텐츠 자동화 파이프라인 시작")
    logger.info("=" * 60)
    
    # 1단계: 데이터 수집
    logger.info("\n[1/3] 데이터 수집...")
    collector = ContentCollector()
    
    hn_stories = collector.get_hackernews(limit=5)
    devto_articles = collector.get_devto(tag='javascript', limit=3)
    
    collected_data = {
        'hackernews': hn_stories,
        'devto': devto_articles,
        'timestamp': datetime.now().isoformat(),
        'total': len(hn_stories) + len(devto_articles)
    }
    
    collector.save_data(collected_data)
    
    # 2단계: AI 재작성
    logger.info("\n[2/3] AI 재작성...")
    processor = ContentProcessor()
    
    rewritten_posts = []
    
    for article in devto_articles:
        rewritten = processor.rewrite_content(
            content=article.get('body_markdown', article.get('summary', '')),
            title=article['title'],
            source='devto'
        )
        
        # SEO 메타 생성
        seo_meta = processor.generate_seo_meta(
            title=article['title'],
            content=rewritten['korean_content'][:500]
        )
        
        rewritten['seo_meta'] = seo_meta
        rewritten_posts.append(rewritten)
    
    # 재작성된 포스트 저장
    output_path = Path('scripts') / 'rewritten_posts.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(rewritten_posts, f, ensure_ascii=False, indent=2)
    logger.info(f"[DONE] 재작성 완료: {output_path}")
    
    # 3단계: 배포
    logger.info("\n[3/3] 콘텐츠 배포...")
    publisher = ContentPublisher()
    
    published_count = publisher.publish_all(rewritten_posts)
    
    logger.info("\n" + "=" * 60)
    logger.info("[DONE] 자동화 파이프라인 완료!")
    logger.info("=" * 60)
    
    return published_count > 0


if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"💥 예상치 못한 오류: {e}", exc_info=True)
        sys.exit(1)
