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
    { title: "중소기업을 위한 마케팅 자동화 SaaS 도입 완벽 가이드", category: "SaaS", description: "외산 툴의 한계를 넘어, 한국 스타트업 실정에 맞는 합리적인 자동화 솔루션 세팅 방법", href: "/posts" },
    { title: "초기 앱 유저 확보(UA)를 위한 AI 기반 광고 네트워크 최적화 전략", category: "AI", description: "1인 개발자도 가능한, AI 타겟팅을 활용한 최신 애드테크(Ad-Tech) 활용법", href: "/posts" },
    { title: "B2B SaaS 영업팀이 반드시 써야 할 AI 이메일 자동화 도구 5선", category: "SaaS", description: "콜드 메일 응답률을 3배 높인 실무자들의 실전 세팅 노하우 공개", href: "/posts" },
    { title: "노코드로 구현하는 업무 자동화: Zapier vs Make vs n8n 비교 분석", category: "Automation", description: "각 툴의 가격·연동 범위·학습 곡선을 직접 테스트해 정리한 2026년 최신 버전", href: "/posts" },
    { title: "AI 글쓰기 도구로 콘텐츠 마케팅 비용 70% 줄이기", category: "AI", description: "ChatGPT·Gemini·Claude를 섞어 쓰는 실무 워크플로우와 품질 관리 체크리스트", href: "/posts" },
    { title: "2026년 스타트업 필수 테크 스택 총정리", category: "Development", description: "MVP부터 스케일업까지, 비용 최소화·속도 최대화를 동시에 잡는 기술 선택 가이드", href: "/posts" },
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

        {/* 히어로 섹션 */}
        <div className="mb-12 p-10 rounded-3xl bg-neutral-900 border border-neutral-700">
          <h1 className="text-4xl font-extrabold text-white mb-6 tracking-tighter">
            지능형 <span className="text-blue-400">IT 가이드</span> 포털
          </h1>
          <p className="text-neutral-400 text-lg max-w-3xl mb-8 leading-8">
            비즈니스 생산성을 높이는 최신 B2B SaaS 도입 가이드와 AI 활용 핵심 인사이트를 매일 업데이트합니다.<br />
            글로벌 IT 트렌드의 정수를 실무에 바로 적용 가능한 한국어 인사이트로 선점하세요.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#guides" className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-colors">
              최신 가이드 보기
            </Link>
            <Link href="/posts" className="px-6 py-3 border border-neutral-600 text-neutral-200 rounded-full font-bold hover:border-blue-400 hover:text-blue-300 transition-colors">
              AI 자동 포스트 보기
            </Link>
            {featuredPost ? (
              <Link href={`/posts/${featuredPost.slug}`} className="px-6 py-3 border border-neutral-600 text-neutral-200 rounded-full font-bold hover:border-blue-400 hover:text-blue-300 transition-colors">
                대표 글 읽기
              </Link>
            ) : null}
          </div>
        </div>

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

          {latestPosts.length > 0 && (
            <ul className="space-y-3">
              {latestPosts.map((post) => (
                <li key={post.slug} className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 transition hover:border-blue-700">
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

        {/* 가이드 그리드 */}
        <div className="mb-4 flex items-center justify-between" id="guides">
          <h2 className="text-2xl font-bold text-white">최신 IT 활용 가이드</h2>
          <Link href="/posts" className="rounded-full border border-neutral-700 px-4 py-1.5 text-sm text-neutral-300 hover:border-blue-400 hover:text-blue-300 transition-colors">전체 보기</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-28 mb-12">
          {guides.map((guide) => (
            <GuideCard key={guide.title} {...guide} />
          ))}
        </div>
      </div>
    </main>
  );
}
