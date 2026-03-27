import GuideCard from '@/components/GuideCard';
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

interface Guide {
  title: string;
  category: string;
  description: string;
}

export default async function HomePage() {
  const latestPosts = (await getAllPosts()).slice(0, 3);

  const guides: Guide[] = [
    { title: "ChatGPT 실무 프롬프트 50선", category: "AI", description: "업무 효율을 2배로 높이는 필수 프롬프트" },
    { title: "Next.js 16 App Router 마스터하기", category: "Development", description: "서버 컴포넌트부터 API 연동까지" },
    { title: "2026년 필수 생산성 앱 베스트 10", category: "App", description: "당신의 시간을 아껴줄 스마트한 도구들" },
    { title: "연속혈당측정기(CGM) 활용 가이드", category: "Tech&Health", description: "데이터로 관리하는 건강한 식습관" },
  ];

  return (
    <main className="min-h-screen bg-black text-neutral-100 p-8 md:p-16">
      {/* 네비게이션 바 (Glassmorphism 상단 고정) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border border-neutral-800 bg-black/50 backdrop-blur-lg flex gap-8 items-center">
        <span className="text-lg font-bold text-blue-400">TechGuide.ai</span>
        <div className="flex gap-6 text-sm text-neutral-300">
          <span>AI</span> <span>Dev</span> <span>Trends</span>
        </div>
      </nav>

      {/* 메인 콘텐츠 영역 (Bento Grid) */}
      <div className="max-w-7xl mx-auto pt-24">
        <h1 className="text-5xl font-extrabold text-white mb-12 tracking-tighter">
          지능형 <span className="text-blue-400">IT 가이드</span> 포털
        </h1>

        <section className="mb-10 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
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
                    <p className="mt-1 text-sm text-neutral-400">{post.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bento Grid layout: md 크기 이상에서 3컬럼 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
