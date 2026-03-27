# Dev.to API 가이드: 실무 튜토리얼 & 개발 가이드

## 개요

**Dev.to**는 개발자 중심의 콘텐츠 플랫폼입니다. **Forem API**를 통해 제공하는 가장 큰 장점은 **마크다운 본문 전체를 API로 직접 가져올 수 있다**는 점입니다.

이는 AI 기반 콘텐츠 자동화에서 가장 완벽한 재료가 됩니다.

### 특징
- ✅ 마크다운 본문 전체 제공 (`body_markdown`)
- ✅ 개발자 친화적 콘텐츠
- ✅ 태그 기반 검색 (AI, SaaS, JavaScript 등)
- ✅ 무료 API 제공

---

## API 엔드포인트

### 1. 아티클 목록 검색
```
GET https://dev.to/api/articles
```

**쿼리 파라미터:**
| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `tag` | 검색 태그 | `javascript`, `ai`, `saas` |
| `per_page` | 페이지당 결과 수 | `10` |
| `page` | 페이지 번호 | `1` |
| `state` | 글 상태 | `fresh` (최신) |

**응답 예시:**
```json
[
  {
    "id": 1234567,
    "title": "Building Scalable Node.js Applications",
    "description": "A comprehensive guide to...",
    "slug": "building-scalable-nodejs-applications-abc123",
    "user": {
      "id": 123,
      "username": "john_dev",
      "name": "John Developer"
    },
    "published_at": "2024-03-20T10:00:00Z",
    "reading_time_minutes": 8,
    "reactions_count": 245
  }
]
```

### 2. 상세 아티클 조회 (핵심!)
```
GET https://dev.to/api/articles/{id}
```

**응답 예시 (중요 필드):**
```json
{
  "id": 1234567,
  "title": "Building Scalable Node.js Applications",
  "description": "A comprehensive guide to...",
  "body_markdown": "# Building Scalable Node.js Applications\n\n## Introduction\nNode.js has become...",
  "url": "https://dev.to/john_dev/building-scalable-nodejs-applications-abc123",
  "user": { "name": "John Developer" },
  "published_at": "2024-03-20T10:00:00Z",
  "reading_time_minutes": 8,
  "reactions_count": 245,
  "comments_count": 32,
  "tags": ["javascript", "nodejs", "performance"]
}
```

---

## Node.js 구현 (Next.js API Route)

### API 라우트: `src/app/api/trending/devto.ts`

```typescript
import { NextResponse } from 'next/server';
import axios from 'axios';

interface DevToArticle {
  title: string;
  description: string;
  url: string;
  id: number;
  author: string;
  publishedAt: string;
  readingTimeMinutes: number;
  reactionsCount: number;
}

const BASE_URL = 'https://dev.to/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag') || 'javascript';
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    // 1. 특정 태그의 아티클 목록 검색
    const response = await axios.get(`${BASE_URL}/articles`, {
      params: {
        tag,
        per_page: limit,
        state: 'fresh',
      },
    });

    // 2. 응답 데이터 변환
    const articles: DevToArticle[] = response.data.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      id: article.id,
      author: article.user?.name || 'Unknown',
      publishedAt: article.published_at,
      readingTimeMinutes: article.reading_time_minutes || 5,
      reactionsCount: article.reactions_count || 0,
    }));

    return NextResponse.json({
      success: true,
      data: articles,
      tag,
    });
  } catch (error) {
    console.error('Dev.to API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Dev.to articles' },
      { status: 500 }
    );
  }
}
```

---

## Python 구현

```python
import requests
import json

def get_devto_articles_by_tag(tag, limit=3):
    """Dev.to에서 특정 태그의 최신 인기 아티클 본문을 가져옵니다."""
    
    # 1. 특정 태그의 아티클 목록 검색
    search_url = "https://dev.to/api/articles"
    params = {
        "tag": tag,
        "per_page": limit,
        "state": "fresh"  # 최신 글 위주
    }
    
    response = requests.get(search_url, params=params)
    articles = response.json()
    
    detailed_posts = []
    
    # 2. 각 아티클의 본문(Markdown) 가져오기
    for article in articles:
        article_id = article['id']
        detail_url = f"https://dev.to/api/articles/{article_id}"
        
        try:
            detail_data = requests.get(detail_url).json()
            
            post_info = {
                "title": detail_data.get('title'),
                "description": detail_data.get('description'),
                "body_markdown": detail_data.get('body_markdown'),  # 블로그 자동화의 핵심!
                "url": detail_data.get('url'),
                "author": detail_data.get('user', {}).get('name'),
                "reading_time": detail_data.get('reading_time_minutes'),
                "reactions": detail_data.get('reactions_count'),
                "published_at": detail_data.get('published_at')
            }
            detailed_posts.append(post_info)
        except Exception as e:
            print(f"Failed to fetch article {article_id}: {e}")
            
    return detailed_posts

# 사용 예시
if __name__ == "__main__":
    print("💻 Dev.to JavaScript 최신 가이드\n")
    devto_data = get_devto_articles_by_tag("javascript", 3)
    
    for i, data in enumerate(devto_data, 1):
        print(f"{i}. {data['title']}")
        print(f"   작성자: {data['author']} | 📖 {data['reading_time']}분")
        print(f"   ❤️ {data['reactions']} 반응 | 🔗 {data['url']}")
        print(f"   본문 미리보기: {data['body_markdown'][:100]}...\n")
```

---

## 마크다운 본문 활용 (AI 자동화)

### body_markdown의 강력한 장점

Dev.to API에서 가져온 `body_markdown`은 이미 **완벽한 마크다운 형식**이므로:

1. **AI로 직접 재작성 가능** - Gemini API 활용
2. **HTML로 변환 가능** - markdown-to-html 라이브러리
3. **다른 블로그 플랫폼에 바로 발행** - 재포맷팅 최소화

### 자동화 파이프라인 예시

```python
import google.generativeai as genai

def rewrite_with_ai(body_markdown, original_title):
    """AI를 사용해 마크다운 본문을 개인 경험이 들어간 포스트로 재작성"""
    
    model = genai.GenerativeModel('gemini-pro')
    
    prompt = f"""
    다음 마크다운 기술 문서를 바탕으로, 기계적인 말투를 제거하고 
    개인의 경험과 인사이트가 들어간 한국어 블로그 포스트로 재작성해 줄래?
    
    원본 제목: {original_title}
    
    마크다운 본문:
    {body_markdown[:2000]}  # 토큰 절약
    
    요구사항:
    - 한국어로 자연스럽게 작성
    - 실무 경험 반영
    - 코드 예제 유지
    - 마크다운 형식 유지
    - 800-1200단어
    """
    
    response = model.generate_content(prompt)
    return response.text

# 사용 예시
devto_articles = get_devto_articles_by_tag("nodejs", 2)

for article in devto_articles:
    rewritten = rewrite_with_ai(
        article['body_markdown'],
        article['title']
    )
    
    # 블로그에 발행 (Blogger API, Medium API 등)
    publish_to_blog(
        title=article['title'],
        content=rewritten,
        tags=['Node.js', 'JavaScript', 'Backend']
    )
```

---

## 활용 사례

### 1. 기술 큐레이션 자동화
- Dev.to에서 `AI`, `SaaS` 태그 수집
- Gemini API로 한국어 요약
- 뉴스레터 자동 발행

### 2. 개인 기술 블로그 확장
- 인기 기술 포스트 → body_markdown 추출
- 개인 경험 추가해서 재작성
- 다중 플랫폼 자동 발행

### 3. 팀 러닝 자료 생성
- 팀이 관심있는 태그 수집
- 마크다운 본문 → 커스텀 교육 자료로 변환
- 팀 위키에 자동 업로드

---

## 실전 팁

### 1. 필터링 전략
```python
# 특정 조건만 수집
high_quality_articles = [
    article for article in articles
    if article['reactions_count'] > 50
    and article['reading_time_minutes'] < 15
]
```

### 2. 캐싱 (1시간 권장)
```typescript
const CACHE_DURATION = 60 * 60 * 1000;
let cache = null;
let cacheTime = 0;
```

### 3. 본문 크기 조절
```python
# body_markdown이 너무 길 수 있으므로 분할
def split_markdown_sections(body_markdown):
    sections = body_markdown.split('\n## ')
    return sections[:5]  # 상위 5개 섹션만 사용
```

---

## 참고 자료
- 📖 [Dev.to API 공식 문서](https://developers.forem.com/api/v0)
- 🌐 [Dev.to](https://dev.to/)
- 🔗 [Forem - DEV 기반 오픈소스](https://www.forem.com/)
