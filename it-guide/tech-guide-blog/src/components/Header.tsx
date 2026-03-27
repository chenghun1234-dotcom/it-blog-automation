'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/50 backdrop-blur-xl border-b border-neutral-800/50">
      <nav className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold hover:text-neon-blue transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg" />
          <span className="text-white">TechGuide</span>
        </Link>

        {/* 메뉴 */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <a href="#" className="text-neutral-300 hover:text-white transition-colors">
            가이드
          </a>
          <a href="#" className="text-neutral-300 hover:text-white transition-colors">
            카테고리
          </a>
          <a href="#" className="text-neutral-300 hover:text-white transition-colors">
            검색
          </a>
        </div>

        {/* CTA 버튼 */}
        <button className="px-4 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-sm font-medium hover:bg-neon-blue/20 transition-all">
          구독
        </button>
      </nav>
    </header>
  );
}
