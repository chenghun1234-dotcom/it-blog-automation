'use client';

import { motion } from 'framer-motion';

interface GuideCardProps {
  title: string;
  category: string;
  description: string;
}

export default function GuideCard({ title, category, description }: GuideCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }} // 호버 시 부드럽게 상승
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      // Tailwind의 backdrop-blur 및 border-opacity 활용
      className="relative overflow-hidden p-6 rounded-3xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-xl shadow-2xl cursor-pointer group"
    >
      {/* 카드 상단 카테고리 칩 */}
      <span className="inline-block px-3 py-1 text-xs font-medium text-blue-400 bg-blue-950/50 rounded-full border border-blue-800 mb-4">
        {category}
      </span>

      {/* 가이드 제목 */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>

      {/* 가이드 설명 (두 줄로 제한) */}
      <p className="text-neutral-400 text-sm line-clamp-2">
        {description}
      </p>

      {/* 하단 화살표 아이콘 */}
      <div className="absolute bottom-6 right-6 text-neutral-600 group-hover:text-blue-400 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </motion.div>
  );
}