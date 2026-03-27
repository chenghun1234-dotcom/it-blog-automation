'use client';

import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TOCProps {
  headings: TOCItem[];
}

export default function TOC({ headings }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="sticky top-28 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-neutral-700/50 bg-gradient-to-b from-neutral-900/80 to-black/80 p-6 backdrop-blur-lg shadow-2xl">
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <span className="w-1 h-5 bg-gradient-to-b from-neon-blue to-neon-purple rounded"></span>
        목차
      </h3>
      <ul className="space-y-2.5">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <li
              key={heading.id}
              className={`transition-all duration-300 ease-out ${
                heading.level === 2 ? 'pl-0' : 'pl-5'
              }`}
            >
              <a
                href={`#${heading.id}`}
                className={`inline-flex items-center gap-2 text-sm py-1 px-2 rounded transition-all duration-200 ${
                  isActive
                    ? 'text-neon-blue font-semibold bg-neon-blue/10 scale-105'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-pulse"></span>}
                <span>{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
