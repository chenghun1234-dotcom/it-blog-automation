# 블로그 콘텐츠 자동화 완전 가이드: 수집 → AI 가공 → 배포

## 📋 목차
1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [단계별 구현](#단계별-구현)
4. [실전 팁](#실전-팁)

---

## 개요

**자동화 파이프라인**은 다음과 같이 구성됩니다:

```
Hacker News/Dev.to → 데이터 수집 → AI 재작성 → 블로그 자동 발행
```

이 방식의 장점:
- 📈 **생산성**: 1주일에 10개 포스트 자동 생성
- 🎯 **품질**: AI 재작성으로 표절 회피
- ⚡ **속도**: 최신 트렌드를 몇 시간 내에 한국어로 변환
- 💰 **비용**: 무료/저비용 API 활용

---

## 아키텍처

### 전체 흐름도

```
┌─────────────────────────────────────────────────────────┐
│ 1. 데이터 수집 (Data Collection)                       │
├─────────────────────────────────────────────────────────┤
│ • Hacker News API → 트렌드 뉴스                        │
│ • Dev.to API → body_markdown 추출                      │
│ • GitHub Trending → 핫 리포지토리                       │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 2. AI 가공 (AI Processing)                            │
├─────────────────────────────────────────────────────────┤
│ • Google Gemini API로 한국어 재작성                     │
│ • 개인 경험 톤 추가                                     │
│ • SEO 최적화 (제목, 메타 설명)                         │
│ • 표절 회피 프롬프트 적용                              │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ 3. 배포 (Deployment)                                  │
├─────────────────────────────────────────────────────────┤
│ • Blogger API / Medium API로 자동 발행                  │
│ • Next.js 정적 사이트 생성                              │
│ • 뉴스레터 자동 배포 (Mailchimp)                       │
│ • SNS 크로스포스팅                                     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
           ✅ 자동 온라인 발행!
```

---

## 단계별 구현

### 단계 1: 데이터 수집

#### Python 스크립트: `collect_data.py`

```python
import requests
import json
from datetime import datetime

class ContentCollector:
    def __init__(self):
        self.hn_url = "https://hacker-news.firebaseio.com/v0"
        self.devto_url = "https://dev.to/api"
    
    def get_hackernews(self, limit=5):
        """Hacker News 인기글 수집"""
        try:
            top_stories = requests.get(f"{self.hn_url}/topstories.json").json()[:limit]
            stories = []
            
            for story_id in top_stories:
                item = requests.get(f"{self.hn_url}/item/{story_id}.json").json()
                if item.get('type') == 'story':
                    stories.append({
                        'source': 'hackernews',
                        'title': item.get('title'),
                        'url': item.get('url', f"https://news.ycombinator.com/item?id={story_id}"),
                        'score': item.get('score'),
                        'content': f"Hacker News 트렌드: {item.get('title')}"
                    })
            
            return stories
        except Exception as e:
            print(f"Hacker News 수집 실패: {e}")
            return []
    
    def get_devto(self, tag='nodejs', limit=3):
        """Dev.to 아티클 수집 (body_markdown 포함)"""
        try:
            articles_resp = requests.get(
                f"{self.devto_url}/articles",
                params={'tag': tag, 'per_page': limit}
            ).json()
            
            articles = []
            for article in articles_resp:
                detail = requests.get(f"{self.devto_url}/articles/{article['id']}").json()
                articles.append({
                    'source': 'devto',
                    'title': detail.get('title'),
                    'url': detail.get('url'),
                    'content': detail.get('body_markdown'),  # 핵심!
                    'author': detail.get('user', {}).get('name'),
                    'reading_time': detail.get('reading_time_minutes')
                })
            
            return articles
        except Exception as e:
            print(f"Dev.to 수집 실패: {e}")
            return []
    
    def save_data(self, data, filename='collected_data.json'):
        """수집 데이터 저장"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 데이터 저장 완료: {filename}")

# 실행
collector = ContentCollector()
all_data = {
    'hackernews': collector.get_hackernews(5),
    'devto': collector.get_devto('javascript', 3),
    'timestamp': datetime.now().isoformat()
}
collector.save_data(all_data)
```

---

### 단계 2: AI 재작성 (Gemini API)

#### Python 스크립트: `ai_rewrite.py`

```python
import google.generativeai as genai
import json

def setup_gemini():
    """Gemini API 초기화"""
    genai.configure(api_key="YOUR_GEMINI_API_KEY")
    return genai.GenerativeModel('gemini-pro')

MEDIUM_AVOIDANCE_PROMPT = """
당신은 전문 기술 블로거입니다.
다음 원본 콘텐츠를 바탕으로 새로운 한국어 기술 포스트를 작성해주세요.

요구사항:
1. 기계적 표현 제거 (예: "이 가이드에서는", "알아보겠습니다" 금지)
2. 실제 프로젝트 경험 추가 (예: "지난 프로젝트에서...")
3. 친근하지만 전문적인 톤
4. 코드 예제는 실행 가능한 형태로 유지
5. 표절 의심 회피 (30% 이상 유사도 방지)
6. 마크다운 형식 유지

원본 콘텐츠:
{content}

한국어 포스트 작성 (800-1200단어):
"""

def rewrite_content(model, content, title):
    """AI로 콘텐츠 재작성"""
    prompt = MEDIUM_AVOIDANCE_PROMPT.format(content=content[:2000])
    
    response = model.generate_content(prompt)
    
    return {
        'title': title,
        'korean_content': response.text,
        'original_url': '',  # 원본 URL 추가
        'status': 'rewritten'
    }

def generate_seo_meta(model, title, content):
    """SEO 메타 데이터 생성"""
    seo_prompt = f"""
    다음 블로그 포스트 제목과 일부 내용을 보고 SEO 최적화된 메타 데이터를 생성하세요.
    
    제목: {title}
    내용: {content[:500]}
    
    JSON 형식으로 반환:
    {{
        "seo_title": "검색 최적화 제목 (50-60자)",
        "seo_description": "메타 설명 (120-160자)",
        "keywords": ["키워드1", "키워드2", "키워드3"],
        "og_title": "소셜 미디어 제목",
        "og_description": "소셜 미디어 설명"
    }}
    """
    
    response = model.generate_content(seo_prompt)
    return json.loads(response.text)

# 실행
model = setup_gemini()

with open('collected_data.json', 'r', encoding='utf-8') as f:
    collected = json.load(f)

rewritten_posts = []

for article in collected['devto']:
    rewritten = rewrite_content(model, article['content'], article['title'])
    seo_meta = generate_seo_meta(model, article['title'], article['content'])
    
    rewritten['seo_meta'] = seo_meta
    rewritten_posts.append(rewritten)
    
    print(f"✅ {article['title']} 재작성 완료")

# 저장
with open('rewritten_posts.json', 'w', encoding='utf-8') as f:
    json.dump(rewritten_posts, f, ensure_ascii=False, indent=2)

print(f"\n✅ 총 {len(rewritten_posts)}개 포스트 재작성 완료!")
```

---

### 단계 3: 자동 배포

#### Python 스크립트: `deploy.py`

```python
import json
import os
from datetime import datetime

class BlogPublisher:
    def __init__(self):
        self.posts = []
    
    def load_rewritten_posts(self, filename='rewritten_posts.json'):
        """재작성된 포스트 로드"""
        with open(filename, 'r', encoding='utf-8') as f:
            self.posts = json.load(f)
    
    def publish_to_blogger(self, post):
        """Blogger API로 발행 (추가 설정 필요)"""
        import requests
        
        # 실제 구현: Google OAuth 토큰 필요
        print(f"📝 Blogger에 발행: {post['title']}")
        # API 호출 코드...
    
    def publish_to_nextjs(self, post):
        """Next.js 정적 마크다운으로 저장"""
        filename = f"public/posts/{post['title'].lower().replace(' ', '-')}.md"
        
        content = f"""---
title: {post['title']}
date: {datetime.now().isoformat()}
author: Your Name
seo_title: {post['seo_meta']['seo_title']}
seo_description: {post['seo_meta']['seo_description']}
keywords: {', '.join(post['seo_meta']['keywords'])}
---

{post['korean_content']}
"""
        
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Next.js에 저장: {filename}")
    
    def publish_all(self):
        """모든 포스트 배포"""
        for post in self.posts:
            self.publish_to_nextjs(post)
            # self.publish_to_blogger(post)  # 필요시 활성화
            print()

# 실행
publisher = BlogPublisher()
publisher.load_rewritten_posts()
publisher.publish_all()

print("🎉 모든 포스트 배포 완료!")
```

---

## 실전 팁

### 1. 일정 자동화 (크론 작업)

**Linux/Mac:**
```bash
# 매일 오전 9시에 실행
0 9 * * * cd /path/to/scripts && python collect_and_publish.py
```

**Windows (Task Scheduler):**
```powershell
# PowerShell에서 작업 예약
$trigger = New-ScheduledTaskTrigger -Daily -At 9AM
Register-ScheduledTask -TaskName "BlogAutoPublish" -Trigger $trigger -Action (New-ScheduledTaskAction -Execute "python" -Argument "C:\scripts\collect_and_publish.py")
```

### 2. 오류 모니터링

```python
import logging

logging.basicConfig(
    filename='automation.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

try:
    # 자동화 코드
    pass
except Exception as e:
    logging.error(f"자동화 실패: {e}")
    # 알람 발송 (이메일, 슬랙 등)
```

### 3. 품질 검증

```python
def validate_rewritten_content(original, rewritten):
    """표절도, 단어 수 등 검증"""
    from difflib import SequenceMatcher
    
    similarity = SequenceMatcher(None, original, rewritten).ratio()
    
    if similarity > 0.3:
        print("⚠️ 표절도 높음!")
        return False
    
    word_count = len(rewritten.split())
    if word_count < 500:
        print("⚠️ 단어 수 부족!")
        return False
    
    return True
```

---

## 결론

이 자동화 파이프라인은:
- **주 10-20개 포스트** 자동 생성
- **표절 회피** 방식으로 블로그 트래픽 증대
- **최신 트렌드** 실시간 큐레이션

**추가 개선 아이디어:**
- 🤖 ChatGPT / Claude API 활용
- 📊 애널리틱스 기반 최적화
- 🎨 이미지 자동 생성 (DALL-E)
- 📢 SNS 자동 크로스포스팅

---

## 참고 자료
- 🔗 [Hacker News API](https://github.com/HackerNews/API)
- 📖 [Dev.to API](https://developers.forem.com/api/v0)
- 🤖 [Google Gemini API](https://ai.google.dev/)
- 📝 [Blogger API](https://developers.google.com/blogger/docs/3.0/overview)
- 🎯 [Medium API](https://github.com/Medium/medium-api-docs)
