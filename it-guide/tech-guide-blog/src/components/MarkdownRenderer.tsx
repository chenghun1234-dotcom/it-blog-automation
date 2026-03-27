'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';

interface MarkdownRendererProps {
  source: string;
  theme?: 'one-dark-pro' | 'dracula';
}

export default function MarkdownRenderer({ source, theme = 'dracula' }: MarkdownRendererProps) {
  return (
    <article className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            if (!match) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock language={match[1] as 'tsx' | 'js' | 'css' | 'bash'}>
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
