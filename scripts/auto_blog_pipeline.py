#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
파이썬 자동화 통합 스크립트 (auto_blog_pipeline.py)
- Dev.to에서 콘텐츠 수집
- Gemini AI로 리라이팅 (AI 감지 회피 프롬프트 포함)
- Medium에 자동 발행

필수 라이브러리:
    pip install requests google-generativeai
"""

import requests
import google.generativeai as genai
import os
import sys
import logging
from pathlib import Path
import re
from datetime import datetime

# UTF-8 인코딩 설정 (Windows 환경)
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# ==========================================
# 🔧 로깅 설정
# ==========================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ==========================================
# 📁 파일 경로 설정
# ==========================================
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
NEXTJS_POSTS_DIR = REPO_ROOT / "it-guide" / "src" / "posts"
NEXTJS_POSTS_DIR.mkdir(parents=True, exist_ok=True)

# ==========================================
# ⚙️ [설정] API 키 및 토큰 (환경 변수 권장)
# ==========================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.0-flash")
MEDIUM_INTEGRATION_TOKEN = os.getenv("MEDIUM_INTEGRATION_TOKEN") or os.getenv("MEDIUM_TOKEN", "YOUR_MEDIUM_TOKEN")
AUTHOR_ID = os.getenv("AUTHOR_ID") or os.getenv("MEDIUM_AUTHOR_ID", "YOUR_MEDIUM_AUTHOR_ID")

# Gemini 설정
if GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("✓ Gemini API 설정 완료")
else:
    logger.warning("⚠️ Gemini API 키를 설정하지 않았습니다. AI 재작성이 비활성화됩니다.")

# ==========================================
# 🟢 STEP 1: 데이터 수집 (Dev.to API)
# ==========================================
def fetch_devto_source(tag="saas", limit=1):
    """
    Dev.to API에서 특정 태그의 최신 아티클을 수집합니다.
    
    Args:
        tag (str): Dev.to 태그 (기본값: "saas")
        limit (int): 가져올 아티클 수 (기본값: 1)
    
    Returns:
        dict: 수집한 아티클 정보 (title, content, url)
    """
    logger.info(f"[{tag}] 태그의 최신 아티클을 Dev.to에서 검색합니다...")
    
    try:
        url = f"https://dev.to/api/articles?tag={tag}&per_page={limit}&state=fresh"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        articles = response.json()
        
        if not articles:
            logger.warning("가져올 글이 없습니다.")
            return None
        
        article_id = articles[0]['id']
        detail_url = f"https://dev.to/api/articles/{article_id}"
        article_data = requests.get(detail_url, timeout=10).json()
        
        source_data = {
            "title": article_data['title'],
            "content": article_data['body_markdown'],
            "url": article_data['url'],
            "author": article_data['user']['name'],
            "reading_time": article_data.get('reading_time_minutes', 5)
        }
        
        logger.info(f"수집 완료: {source_data['title']}")
        return source_data
        
    except Exception as e:
        logger.error(f"Dev.to 데이터 수집 오류: {e}")
        return None

# ==========================================
# 🔵 STEP 2: AI 가공 (Gemini API - 프롬프트 엔지니어링)
# ==========================================
def rewrite_with_gemini(source_data):
    """
    Gemini AI를 사용하여 원본 콘텐츠를 리라이팅합니다.
    AI 감지 회피 프롬프트 포함.
    
    Args:
        source_data (dict): 원본 아티클 정보
    
    Returns:
        str: AI가 재작성한 마크다운 콘텐츠
    """
    
    if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
        logger.warning("Gemini API 키 미설정. 원본 콘텐츠를 그대로 반환합니다.")
        return source_data['content']
    
    logger.info("Gemini가 블로그 포스팅을 재작성 중입니다 (AI 감지 회피 모드)...")
    
    # 2026년형 미디엄 맞춤형 회피 프롬프트
    system_prompt = """
    당신은 10년 차 IT 실무자이자 테크 블로거입니다. 아래 제공된 원본 마크다운 문서를 한국어로 완벽하게 번역하고 재작성하세요.
    
    [절대 규칙 - AI 감지 회피]
    1. 기계적인 서론/결론("알아보겠습니다", "결론적으로") 절대 금지.
    2. 문장 길이를 다양하게 섞으세요 (단답형과 긴 설명 혼합).
    3. 중간에 "제가 실무에서 이 부분을 테스트해 봤을 때..." 같은 1인칭 주관적 경험이나 인사이트를 1~2문장 자연스럽게 창작해서 끼워 넣으세요.
    4. 출력은 완벽한 마크다운(Markdown) 형식이어야 합니다.
    5. 제목은 클릭을 유도하는 매력적인 한국어 제목으로 맨 첫 줄에 '# 제목' 형태로 작성하세요.
    """
    
    user_prompt = f"원본 제목: {source_data['title']}\n원본 저자: {source_data['author']}\n\n원본 내용:\n{source_data['content']}"
    
    try:
        # 최신 지원 모델 사용 (환경변수 GEMINI_MODEL로 재정의 가능)
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(system_prompt + "\n\n" + user_prompt)
        
        logger.info("✓ AI 재작성 완료!")
        return response.text
        
    except Exception as e:
        logger.error(f"Gemini AI 처리 오류: {e}")
        if "quota" in str(e).lower() or "429" in str(e):
            logger.error("Gemini API 할당량(Quota) 초과 상태입니다. 결제/쿼터 설정 또는 잠시 후 재시도하세요.")
        if "not found" in str(e).lower() or "404" in str(e):
            logger.error("지정한 Gemini 모델명이 유효하지 않습니다. GEMINI_MODEL 환경변수를 확인하세요.")
        logger.warning("원본 콘텐츠를 그대로 사용합니다.")
        return source_data['content']


def save_markdown_to_nextjs(markdown_content, source_data):
    """생성된 마크다운을 Next.js 프로젝트 src/posts 폴더에 저장"""
    try:
        lines = markdown_content.strip().split('\n')
        title = lines[0].replace('# ', '').strip() if lines and lines[0].startswith('#') else source_data['title']
        slug = re.sub(r"[^a-zA-Z0-9가-힣\s-]", "", title).strip().lower()
        slug = re.sub(r"\s+", "-", slug)
        if not slug:
            slug = "auto-post"

        filename = f"{datetime.now().strftime('%Y%m%d')}-{slug[:70]}.md"
        target_path = NEXTJS_POSTS_DIR / filename

        file_content = (
            f"{markdown_content}\n\n"
            f"---\n"
            f"원문: [{source_data['url']}]({source_data['url']})\n"
            f"수집일: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        )

        target_path.write_text(file_content, encoding='utf-8')
        logger.info(f"✅ 마크다운 저장 완료: {target_path}")
        return str(target_path)
    except Exception as e:
        logger.error(f"마크다운 파일 저장 오류: {e}")
        return None

# ==========================================
# 🟣 STEP 3: 자동 발행 (Medium API)
# ==========================================
def publish_to_medium(markdown_content, original_url, is_draft=True):
    """
    Medium API를 사용하여 재작성된 콘텐츠를 발행합니다.
    
    Args:
        markdown_content (str): 발행할 마크다운 콘텐츠
        original_url (str): 원문 URL
        is_draft (bool): 임시저장(True) 또는 즉시발행(False)
    
    Returns:
        bool: 성공 여부
    """
    
    if MEDIUM_INTEGRATION_TOKEN == "YOUR_MEDIUM_TOKEN" or AUTHOR_ID == "YOUR_MEDIUM_AUTHOR_ID":
        logger.warning("Medium 토큰 또는 Author ID를 설정하지 않았습니다.")
        logger.info(f"[임시저장 콘텐츠]\n{markdown_content}")
        return False
    
    logger.info("Medium에 포스팅을 업로드합니다...")
    
    try:
        # AI가 작성한 마크다운의 첫 번째 줄(H1)을 추출하여 제목으로 사용
        lines = markdown_content.strip().split('\n')
        title = lines[0].replace('# ', '').strip() if lines[0].startswith('#') else "오늘의 IT 가이드"
        
        # 출처 표기 추가 (저작권 및 플랫폼 정책 준수)
        final_content = markdown_content + f"\n\n---\n*원문 출처: [{original_url}]({original_url})*"
        
        url = f"https://api.medium.com/v1/users/{AUTHOR_ID}/posts"
        headers = {
            "Authorization": f"Bearer {MEDIUM_INTEGRATION_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Charset": "utf-8"
        }
        data = {
            "title": title,
            "contentFormat": "markdown",
            "content": final_content,
            "tags": ["IT", "SaaS", "TechGuide", "Development"],
            "publishStatus": "draft" if is_draft else "public"
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=15)
        
        if response.status_code == 201:
            post_url = response.json()['data']['url']
            status = "임시저장" if is_draft else "발행"
            logger.info(f"🎉 성공적으로 {status}되었습니다!")
            logger.info(f"확인 링크: {post_url}")
            return True
        else:
            logger.error(f"업로드 실패: {response.status_code}")
            logger.error(f"응답: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Medium 발행 오류: {e}")
        return False

# ==========================================
# 🚀 메인 실행부
# ==========================================
def main():
    """메인 파이프라인 실행"""
    logger.info("=" * 60)
    logger.info("🚀 블로그 자동화 파이프라인 시작")
    logger.info("=" * 60)
    
    # 1. Dev.to에서 'webdev' (웹개발) 관련 최신 글 1개 가져오기
    source = fetch_devto_source(tag="webdev", limit=1)
    
    if not source:
        logger.error("데이터 수집 실패. 파이프라인을 중단합니다.")
        return
    
    # 2. Gemini로 리라이팅
    new_blog_post = rewrite_with_gemini(source)

    # 3. Next.js 프로젝트 src/posts 폴더에 저장
    saved_path = save_markdown_to_nextjs(new_blog_post, source)
    
    # 4. 미디엄에 임시저장으로 퍼블리싱
    success = publish_to_medium(new_blog_post, source['url'], is_draft=True)
    
    logger.info("=" * 60)
    if success:
        logger.info("✅ 파이프라인 완료!")
    else:
        logger.info("⚠️ 파이프라인 완료 (일부 단계 실패)")
    if saved_path:
        logger.info(f"📁 저장 경로: {saved_path}")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()
