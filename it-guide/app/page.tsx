import GuideCard from '@/components/GuideCard';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

interface Guide {
  title: string;
  category: string;
  description: string;
  href: string;
}

export default async function HomePage() {
  const latestPosts = (await getAllPosts()).slice(0, 3);
  const featuredPost = latestPosts[0];

  const guides: Guide[] = [
    { title: "ChatGPT 실무 프롬프트 50선", category: "AI", description: "업무 효율을 2배로 높이는 필수 프롬프트와 템플릿 묶음", href: "/posts" },
    { title: "Next.js 16 App Router 마스터하기", category: "Development", description: "서버 컴포넌트부터 API 연동까지 실전 예제로 학습", href: "/posts" },
    { title: "2026년 필수 생산성 앱 베스트 10", category: "App", description: "당신의 시간을 아껴줄 스마트한 도구들과 자동화 팁", href: "/posts" },
    { title: "연속혈당측정기(CGM) 활용 가이드", category: "Tech&Health", description: "데이터로 관리하는 건강한 식습관과 실사용 인사이트", href: "/posts" },
  ];

  return (
    <main className="min-h-screen bg-black text-neutral-100 p-8 md:p-16">
      {/* 네비게이션 바 (Glassmorphism 상단 고정) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border border-neutral-800 bg-black/50 backdrop-blur-lg flex gap-8 items-center">
        <span className="text-lg font-bold text-blue-400">TechGuide.ai</span>
        <div className="flex gap-6 text-sm text-neutral-300">
          <a href="#latest-posts" className="hover:text-blue-300 transition-colors">Latest</a>
          <a href="#guides" className="hover:text-blue-300 transition-colors">Guides</a>
          <Link href="/posts" className="hover:text-blue-300 transition-colors">Posts</Link>
        </div>
      </nav>

      {/* 메인 콘텐츠 영역 (Bento Grid) */}
      <div className="max-w-7xl mx-auto pt-24">
        <h1 className="text-5xl font-extrabold text-white mb-12 tracking-tighter">
          지능형 <span className="text-blue-400">IT 가이드</span> 포털
        </h1>

        <section className="mb-10 rounded-2xl border border-blue-900/50 bg-gradient-to-br from-blue-950/20 to-neutral-900/30 p-6">
          <h2 className="text-2xl font-bold text-blue-300">AI 자동 블로그 파이프라인</h2>
          <p className="mt-3 text-neutral-300 leading-7">
            Dev.to에서 최신 글을 수집하고, Gemini로 한국어 재작성한 뒤, 결과를 마크다운으로 저장해 사이트에 자동 반영합니다.
            GitHub Actions가 생성 파일을 자동 커밋하여, 배포된 웹사이트에서도 새 글이 바로 보이도록 연결되어 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/posts" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 transition-colors">
              최신 포스트 보러가기
            </Link>
            {featuredPost ? (
              <Link href={`/posts/${featuredPost.slug}`} className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:border-blue-400 hover:text-blue-300 transition-colors">
                대표 글 바로 읽기
              </Link>
            ) : null}
          </div>
        </section>

        <section id="latest-posts" className="mb-10 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 scroll-mt-28">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-blue-300">자동 생성 최신 포스트</h2>
            <Link
              href="/posts"
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 transition hover:border-blue-400 hover:text-blue-300"
            >
              전체 보기
            </Link>
          </div>

          {latestPosts.length === 0 ? (
            <p className="text-sm text-neutral-400">아직 생성된 포스트가 없습니다. GitHub Actions 실행 후 확인하세요.</p>
          ) : (
            <ul className="space-y-3">
              {latestPosts.map((post) => (
                <li key={post.slug} className="rounded-lg border border-neutral-800 p-4">
                  <Link href={`/posts/${post.slug}`} className="block hover:text-blue-300">
                    <p className="font-semibold text-neutral-100">{post.title}</p>
                    <p className="mt-1 text-sm text-neutral-400 leading-6">{post.excerpt}</p>
                    <p className="mt-2 text-xs text-neutral-500">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bento Grid layout: md 크기 이상에서 3컬럼 */}
        <div id="guides" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-28">
          {/* 첫 번째 카드는 2개 컬럼을 차지 (강조) */}
          <div className="md:col-span-2">
            <GuideCard {...guides[0]} />
          </div>
          
          <GuideCard {...guides[1]} />
          <GuideCard {...guides[2]} />
          
          {/* 마지막 카드는 2개 컬럼을 차지 (강조) */}
          <div className="md:col-span-2">
            <GuideCard {...guides[3]} />
          </div>
        </div>
      </div>
    </main>
  );
}
