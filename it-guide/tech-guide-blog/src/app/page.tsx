import TOC from '@/components/TOC';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TrendingWidget from '@/components/TrendingWidget';

const postMarkdown = [
  '# Next.js 16 + Tailwind CSS 블로그 구축 가이드',
  '',
  '## 소개',
  '이 가이드는 Next.js 16(App Router), Tailwind CSS, Framer Motion 등 최신 스택의 베스트 프랙티스를 다룹니다.',
  '',
  '## 프로젝트 설정',
  '다음 명령으로 프로젝트를 생성하세요.',
  '',
  '```bash',
  'npx create-next-app@latest tech-guide-blog',
  '# TypeScript: Yes',
  '# Tailwind CSS: Yes',
  '# src/ directory: Yes',
  '# App Router: Yes',
  '```',
  '',
  '## 코드 예시',
  '스니펫은 `CodeBlock` 컴포넌트를 통해 제공됩니다.',
  '',
  '```tsx',
  'export default function Example() {',
  '  return (',
  '    <div className="bg-neon-blue text-black p-4">',
  '      Hello, Neo-Tech Minimal!',
  '    </div>',
  '  );',
  '}',
  '```',
  '',
  '### rehype-pretty-code 테마 옵션',
  '- **one-dark-pro** (기본)',
  '- **dracula**',
  '',
  '## 프롬프트 템플릿 (AI 이미지)',
  '### 1. 추상적인 IT/AI 데이터 흐름 (메인 썸네일)',
  'Prompt: A minimalist abstract 3d composition representing cloud computing and artificial intelligence. Dark background with glowing neon blue and purple lines. Floating glassmorphism cubes, translucent UI elements. High quality, unreal engine 5 render, 8k, futuristic, clean and modern --ar 16:9 --v 6.0',
  '',
  '### 2. 코딩 및 개발 환경 (소프트웨어 가이드)',
  'Prompt: A close-up of a modern minimalist developer workspace in dark mode. A sleek monitor displaying glowing holographic code in neon green and blue. Dark desk surface, cinematic ambient lighting, depth of field, photorealistic, tech blog aesthetic --ar 16:9 --style raw',
  '',
  '### 3. 보안 및 인프라 (클라우드/보안)',
  'Prompt: Futuristic glowing data server room, abstract representation of cyber security. Dark metallic textures, bright cyan laser beams, isometric perspective, clean geometry, glass reflections, dark mode UI aesthetic, highly detailed --ar 16:9',
  '',
  '## 결론',
  '이제 다음 단계를 진행할 준비가 되었습니다.',
].join('\n');

function extractHeadings(markdown: string) {
  return Array.from(markdown.matchAll(/^(##+?)\s+(.*)$/gm)).map((m) => {
    const hash = m[1];
    const text = m[2].trim();
    const level = hash.length === 3 ? 3 : 2;
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return { id, text, level };
  });
}

export default function BlogPost() {
  const headings = extractHeadings(postMarkdown);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-3">
              <article className="prose prose-invert max-w-none">
                <MarkdownRenderer source={postMarkdown} theme="dracula" />
              </article>

              {/* 트렌드 위젯 */}
              <div className="mt-12 pt-8 border-t border-neutral-800">
                <TrendingWidget />
              </div>
            </div>

            {/* 사이드바 TOC */}
            <div className="lg:col-span-1">
              <TOC headings={headings} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
