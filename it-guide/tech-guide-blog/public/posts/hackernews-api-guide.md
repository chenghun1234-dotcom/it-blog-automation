# Hacker News API 가이드: 글로벌 IT 트렌드 수집

## 개요

**Hacker News**는 Y Combinator에서 운영하는 기술 뉴스 커뮤니티입니다. Firebase 기반의 **공개 REST API**를 제공하며, 글로벌 IT 트렌드와 혁신적인 서비스 런칭 소식을 실시간으로 수집할 수 있습니다.

### 특징
- ✅ 완전 공개 API (인증 불필요)
- ✅ 실시간 업데이트
- ✅ 커뮤니티 반응(점수, 댓글)이 정량화되어 있음
- ✅ 비즈니스 인사이트 도출에 최적화

---

## API 구조

### 1. 인기글 ID 목록 조회
```
GET https://hacker-news.firebaseio.com/v0/topstories.json
```

**응답 예시:**
```json
[38945678, 38945000, 38944567, ...]
```

### 2. 개별 아이템 상세 정보
```
GET https://hacker-news.firebaseio.com/v0/item/{id}.json
```

**응답 예시:**
```json
{
  "by": "dang",
  "descendants": 521,
  "id": 38945678,
  "kids": [38945900, 38945850, ...],
  "score": 2341,
  "time": 1740000000,
  "title": "Why Your Startup Is Failing: 10 Common Mistakes",
  "type": "story",
  "url": "https://example.com/article"
}
```

---

## Node.js 구현 (Next.js API Route)

### API 라우트: `src/app/api/trending/hackernews.ts`

```typescript
import { NextResponse } from 'next/server';
import axios from 'axios';

interface HNStory {
  title: string;
  url: string;
  score: number;
  id: number;
  by: string;
  time: number;
}

const BASE_URL = 'https://hacker-news.firebaseio.com/v0';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // 1. 인기글 ID 목록 가져오기
    const topStoriesResponse = await axios.get(`${BASE_URL}/topstories.json`);
    const storyIds = topStoriesResponse.data.slice(0, limit);

    // 2. 각 ID별 상세 정보 병렬 처리
    const storyPromises = storyIds.map((id: number) =>
      axios.get(`${BASE_URL}/item/${id}.json`).catch(() => null)
    );

    const responses = await Promise.all(storyPromises);
    const stories: HNStory[] = [];

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      if (response?.data?.type === 'story') {
        stories.push({
          title: response.data.title || '제목 없음',
          url: response.data.url || `https://news.ycombinator.com/item?id=${storyIds[i]}`,
          score: response.data.score || 0,
          id: response.data.id,
          by: response.data.by || 'Anonymous',
          time: response.data.time,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error('Hacker News API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Hacker News data' },
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

def get_hackernews_top_stories(limit=5):
    """Hacker News의 실시간 인기글(Top Stories)을 가져옵니다."""
    
    # 1. 인기글 ID 목록 가져오기
    top_stories_url = "https://hacker-news.firebaseio.com/v0/topstories.json"
    response = requests.get(top_stories_url)
    story_ids = response.json()[:limit]
    
    trending_posts = []
    
    # 2. 각 ID별 상세 정보 가져오기
    for story_id in story_ids:
        item_url = f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
        item_data = requests.get(item_url).json()
        
        if item_data and item_data.get('type') == 'story':
            post_info = {
                "title": item_data.get('title'),
                "url": item_data.get('url', f"https://news.ycombinator.com/item?id={story_id}"),
                "score": item_data.get('score', 0),
                "author": item_data.get('by', 'Anonymous'),
                "comments": item_data.get('descendants', 0)
            }
            trending_posts.append(post_info)
            
    return trending_posts

# 사용 예시
if __name__ == "__main__":
    print("🔥 Hacker News 실시간 트렌드 🔥\n")
    hn_data = get_hackernews_top_stories(5)
    
    for i, data in enumerate(hn_data, 1):
        print(f"{i}. {data['title']}")
        print(f"   👤 {data['author']} | ⭐ {data['score']} | 💬 {data['comments']}")
        print(f"   🔗 {data['url']}\n")
```

---

## 실전 팁

### 1. 캐싱 전략
Hacker News API의 응답이 빈번하게 변하므로, **1시간 캐싱**이 권장됩니다:

```typescript
const CACHE_DURATION = 60 * 60 * 1000; // 1시간

let cachedData = null;
let cacheTime = 0;

// 데이터 요청 시 캐시 확인
if (Date.now() - cacheTime < CACHE_DURATION && cachedData) {
  return cachedData;
}
```

### 2. Rate Limiting 주의
- Hacker News API는 rate limit이 없으나, 과도한 요청은 피해야 합니다
- 병렬 요청 시 최대 10-20개 동시 요청으로 제한하는 것이 좋습니다

### 3. URL 검증
일부 아이템은 `url` 필드가 없을 수 있으므로, 폴백처리가 필요합니다:

```javascript
const url = itemData.url || `https://news.ycombinator.com/item?id=${story_id}`;
```

### 4. 필터링
특정 주제만 수집하려면, 제목에 키워드 필터를 적용:

```python
keywords = ['AI', 'Machine Learning', 'Startup', 'Crypto']
filtered = [post for post in trending_posts if any(kw in post['title'] for kw in keywords)]
```

---

## 활용 사례

### 1. 블로그 자동화
트렌드 뉴스 큐레이션 → Gemini API로 한국어 재작성 → 블로그 자동 발행

### 2. 시장 동향 분석
월간 TOP 100 추출 → 기술 카테고리 분류 → 비즈니스 인사이트 도출

### 3. 영감 수집
개발자 커뮤니티 핫 토픽 모니터링 → 프로젝트 아이디어 발굴

---

## 참고 자료
- 📖 [Hacker News API 공식 문서](https://github.com/HackerNews/API)
- 🔗 [Hacker News](https://news.ycombinator.com/)
- 💾 [Firebase Realtime Database](https://firebase.google.com/docs/database)
