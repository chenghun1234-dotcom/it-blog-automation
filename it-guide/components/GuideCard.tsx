'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface GuideCardProps {
  title: string;
  category: string;
  description: string;
  href: string;
  ctaLabel?: string;
}

export default function GuideCard({ title, category, description, href, ctaLabel = '자세히 보기' }: GuideCardProps) {
  return (
    <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-3xl">
      <motion.article
        whileHover={{ y: -5, scale: 1.02 }} // 호버 시 부드럽게 상승
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        // Tailwind의 backdrop-blur 및 border-opacity 활용
        className="relative h-full overflow-hidden p-6 rounded-3xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-xl shadow-2xl cursor-pointer group"
      >
        {/* 카드 상단 카테고리 칩 */}
        <span className="inline-block px-3 py-1 text-xs font-medium text-blue-400 bg-blue-950/50 rounded-full border border-blue-800 mb-4">
          {category}
        </span>

        {/* 가이드 제목 */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {title}
        </h3>

        {/* 가이드 설명 */}
        <p className="text-neutral-400 text-sm leading-6 mb-6">
          {description}
        </p>

        <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 group-hover:border-blue-500 group-hover:text-blue-300 transition-colors">
          {ctaLabel}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </motion.article>
    </Link>
  );
}