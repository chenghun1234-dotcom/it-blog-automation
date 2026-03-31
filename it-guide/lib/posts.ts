import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  createdAt: string;
}

function resolvePostsDir(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'src', 'posts'),
    path.join(cwd, 'it-guide', 'src', 'posts'),
    path.resolve(__dirname, '..', 'src', 'posts'),
    path.resolve(__dirname, '..', '..', 'src', 'posts'),
  ];

  const found = candidates.find((dir) => existsSync(dir));
  return found ?? candidates[0];
}

function getPostsDir(): string {
  return resolvePostsDir();
}

function normalizeSlug(value: string): string {
  return decodeURIComponent(value).normalize('NFC');
}

function normalizeExcerpt(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/^#\s+.*$/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[>*_`#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function extractTitle(markdown: string, fallback: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || fallback;
}

function extractCreatedAt(fileName: string): string {
  const match = fileName.match(/^(\d{4})(\d{2})(\d{2})-/);
  if (!match) return new Date().toISOString();

  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const POSTS_DIR = getPostsDir();
  try {
    await fs.mkdir(POSTS_DIR, { recursive: true });
    const files = await fs.readdir(POSTS_DIR);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));

    const posts = await Promise.all(
      markdownFiles.map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(POSTS_DIR, fileName);
        const content = await fs.readFile(fullPath, 'utf-8');
        const title = extractTitle(content, slug.replace(/-/g, ' '));

        return {
          slug,
          title,
          excerpt: normalizeExcerpt(content),
          content,
          createdAt: extractCreatedAt(fileName),
        };
      }),
    );

    return posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const POSTS_DIR = getPostsDir();
  try {
    const normalized = normalizeSlug(slug);
    const fullPath = path.join(POSTS_DIR, `${normalized}.md`);
    const content = await fs.readFile(fullPath, 'utf-8');
    const title = extractTitle(content, normalized.replace(/-/g, ' '));

    return {
      slug: normalized,
      title,
      excerpt: normalizeExcerpt(content),
      content,
      createdAt: extractCreatedAt(`${normalized}.md`),
    };
  } catch {
    try {
      const files = await fs.readdir(getPostsDir());
      const normalized = normalizeSlug(slug);
      const matched = files.find((file) => file.replace(/\.md$/, '').normalize('NFC') === normalized);
      if (!matched) return null;

      const content = await fs.readFile(path.join(getPostsDir(), matched), 'utf-8');
      const safeSlug = matched.replace(/\.md$/, '');
      const title = extractTitle(content, safeSlug.replace(/-/g, ' '));

      return {
        slug: safeSlug,
        title,
        excerpt: normalizeExcerpt(content),
        content,
        createdAt: extractCreatedAt(matched),
      };
    } catch {
      return null;
    }
  }
}
