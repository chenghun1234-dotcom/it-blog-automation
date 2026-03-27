import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export const metadata = {
  title: '자동 생성 블로그 포스트',
  description: 'GitHub Actions와 Gemini로 자동 생성된 포스트 목록',
};

export default async function PostsPage() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen bg-black text-neutral-100 px-6 py-12 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">자동 블로그 포스트</h1>
            <p className="mt-2 text-sm text-neutral-400">src/posts에 저장된 글을 자동으로 렌더링합니다.</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-blue-400 hover:text-blue-300"
          >
            홈으로
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-700 p-10 text-center text-neutral-400">
            아직 생성된 포스트가 없습니다.
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.slug} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
                <Link href={`/posts/${post.slug}`} className="group block">
                  <h2 className="text-xl font-semibold text-white transition group-hover:text-blue-400">{post.title}</h2>
                  <p className="mt-3 text-sm text-neutral-300">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-neutral-500">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
