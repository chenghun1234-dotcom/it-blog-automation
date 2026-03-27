'use client';

import { useState } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import js from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('css', css);

interface CodeBlockProps {
  children: string;
  language?: 'tsx' | 'js' | 'css' | 'bash';
  theme?: 'dracula' | 'oneDark';
}

export default function CodeBlock({ children, language = 'tsx', theme = 'dracula' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-neutral-700/50 my-6 shadow-2xl hover:shadow-neon-blue/10 transition-shadow">
      <div className="flex justify-between items-center px-5 py-3 bg-gradient-to-r from-[#1e1e2e] to-[#282c34] border-b border-neutral-700/30">
        <div className="flex gap-2.5">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/20"></div>
        </div>
        <button
          onClick={copyToClipboard}
          className="text-xs text-neutral-400 hover:text-neon-blue transition-colors font-medium"
        >
          {copied ? '✓ 복사됨' : '복사'}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        wrapLines
        showLineNumbers
        customStyle={{
          backgroundColor: 'transparent',
          margin: 0,
          padding: '1.25rem',
          fontSize: '0.875rem',
          borderRadius: 0,
        }}
        lineNumberStyle={{
          color: '#6b7280',
          paddingRight: '1rem',
          minWidth: '3rem',
          textAlign: 'right',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}