# Tech Guide Blog - 자동화된 IT 기술 블로그

## 🎯 개요

**Tech Guide Blog**는 **IT 트렌드 자동화**와 **AI 기반 콘텐츠 생성**을 통해 기술 블로그를 운영하는 Next.js 프로젝트입니다.

### 핵심 기능
- 🔥 **Hacker News API** - 글로벌 IT 트렌드 실시간 수집
- 📝 **Dev.to API** - 개발 튜토리얼 및 가이드 마크다운 추출
- 🤖 **Google Gemini API** - AI 기반 한국어 재작성
- 🎨 **Neo-Tech Minimal Design** - Glassmorphism + Bento Grid
- ⚡ **Next.js 16** - 최신 App Router, TypeScript, Tailwind CSS
- 📊 **자동화 파이프라인** - 수집 → AI 가공 → 자동 발행

---

## 📋 기술 스택

| 카테고리 | 기술 |
|---------|------|
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS 4.0, Glassmorphism |
| **Typography** | Poppins (UI), JetBrains Mono (Code) |
| **Markdown** | react-markdown, remark-gfm |
| **Syntax Highlighting** | react-syntax-highlighter (Prism) |
| **Animation** | Framer Motion |
| **API Integration** | Hacker News, Dev.to, Google Gemini |
| **Automation** | Python, date-fns |

---

## 🚀 빠른 시작

### 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 블로그를 확인하세요.

### 프로덕션 빌드

```bash
npm run build
npm run start
```

---

## 🔗 API 라우트

### Hacker News 트렌드
```
GET /api/trending/hackernews?limit=5
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "title": "...",
      "url": "...",
      "score": 1234,
      "id": 38945678,
      "by": "dang",
      "time": 1740000000
    }
  ]
}
```

### Dev.to 아티클
```
GET /api/trending/devto?tag=javascript&limit=3
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "title": "...",
      "description": "...",
      "url": "...",
      "author": "John Developer",
      "readingTimeMinutes": 8,
      "reactionsCount": 245
    }
  ]
}
```

---

## 🤖 자동화 파이프라인

### Python 스크립트 사용

#### 1. 필수 패키지 설치
```bash
pip install requests google-generativeai
```

#### 2. Gemini API 키 설정
```bash
export GEMINI_API_KEY="your-api-key-here"
```

#### 3. 자동화 실행
```bash
python scripts/fetch_content.py
```

**파이프라인 단계:**
1. **수집** - Hacker News & Dev.to에서 최신 콘텐츠 수집
2. **AI 재작성** - Gemini API로 한국어 재작성
3. **배포** - Next.js 마크다운으로 자동 저장

### 일일 자동화 스케줄 (크론)

**Linux/Mac:**
```bash
# 매일 오전 9시 실행
0 9 * * * cd /path/to/tech-guide-blog && python scripts/fetch_content.py
```

**Windows (Task Scheduler):**
```powershell
$trigger = New-ScheduledTaskTrigger -Daily -At 9AM
Register-ScheduledTask -TaskName "BlogAutoPublish" -Trigger $trigger `
  -Action (New-ScheduledTaskAction -Execute "python" `
  -Argument "C:\path\to\scripts\fetch_content.py")
```

---

## 📚 블로그 가이드 문서

### 포스트 위치: `public/posts/`

1. **Hacker News API 가이드** (`hackernews-api-guide.md`)
   - Hacker News API 구조 및 사용법
   - Node.js / Python 구현 예제
   - 캐싱 및 Rate Limiting 전략

2. **Dev.to API 가이드** (`devto-api-guide.md`)
   - Dev.to API 엔드포인트
   - body_markdown 활용법
   - AI 자동화 연동

3. **콘텐츠 자동화 가이드** (`content-automation-guide.md`)
   - 완전한 수집 → AI 가공 → 배포 파이프라인
   - 실제 구현 코드
   - 트러블슈팅

---

## 🎨 UI 컴포넌트

### 주요 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| `Header` | 고정 네비게이션, 로고, CTA |
| `Footer` | 다중 칼럼 레이아웃, 소셜 링크 |
| `TrendingWidget` | Hacker News & Dev.to 데이터 표시 |
| `TOC` | 목차, IntersectionObserver 활성 상태 |
| `CodeBlock` | 문법 강조, 줄 번호, Mac 스타일 헤더 |
| `MarkdownRenderer` | React Markdown 통합 |

---

## 🎯 색상 팔레트

```css
--neon-blue: #00f0ff
--neon-purple: #7000ff
--neon-green: #00ff66
--dark-bg: #0a0a0a
--card: rgba(20, 20, 20, 0.6)
```

---

## 📈 생산성 향상

이 자동화 파이프라인을 사용하면:

| 항목 | 효과 |
|------|------|
| 📝 **포스트 생성** | 주 1-3시간 → 완전 자동 |
| 🎯 **표절 회피** | AI 재작성으로 100% 오리지널 |
| 💰 **비용** | 무료 API 활용 (Gemini 크레딧 포함) |
| ⚡ **속도** | 트렌드 발견 → 한국어 포스트 < 1시간 |
| 📊 **SEO** | 자동 메타 데이터 생성 |

---

## 🛠️ 개발 팁

### 마크다운 파일 자동 감지
`public/posts/` 디렉토리에 마크다운 파일을 추가하면 자동으로 인식됩니다.

### API 캐싱
- Hacker News: 1시간 캐싱
- Dev.to: 1시간 캐싱
- 캐시 시간 조정: `src/app/api/trending/` 파일 수정

### 환경변수 설정

`.env.local`:
```env
GEMINI_API_KEY=your-api-key-here
NEXT_PUBLIC_BLOG_NAME=Tech Guide Blog
```

---

## 📝 라이선스

MIT License

---

## 🤝 기여

이슈 및 풀 리퀘스트는 언제든 환영합니다!

---

## 📞 지원

- 📖 [Hacker News API](https://github.com/HackerNews/API)
- 📖 [Dev.to API](https://developers.forem.com/api/v0)
- 🤖 [Google Gemini API](https://ai.google.dev/)
- 📚 [Next.js Docs](https://nextjs.org/docs)

---

**Happy Blogging! 🚀**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
