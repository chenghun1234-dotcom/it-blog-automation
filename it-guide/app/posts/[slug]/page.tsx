import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPostBySlug } from '@/lib/posts';

interface PostDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-neutral-100 px-6 py-12 md:px-12">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/posts"
          className="mb-8 inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition hover:border-blue-400 hover:text-blue-300"
        >
          ← 목록으로
        </Link>

        <h1 className="text-3xl font-bold text-blue-400">{post.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</p>

        <div className="prose prose-invert mt-10 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
