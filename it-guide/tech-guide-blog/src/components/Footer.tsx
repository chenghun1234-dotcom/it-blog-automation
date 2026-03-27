'use client';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-800 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* 브랜드 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-br from-neon-blue to-neon-purple rounded" />
              <span className="font-bold text-white">TechGuide</span>
            </div>
            <p className="text-sm text-neutral-400">
              Neo-Tech Minimal 디자인으로 제공하는 현대적인 IT 가이드
            </p>
          </div>

          {/* 링크 */}
          <div>
            <h4 className="font-semibold text-white mb-4">가이드</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <a href="#" className="hover:text-neon-blue transition-colors">
                  AI/ML
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue transition-colors">
                  개발
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue transition-colors">
                  DevOps
                </a>
              </li>
            </ul>
          </div>

          {/* 리소스 */}
          <div>
            <h4 className="font-semibold text-white mb-4">리소스</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <a href="#" className="hover:text-neon-blue transition-colors">
                  문서
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue transition-colors">
                  튜토리얼
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-blue transition-colors">
                  예제
                </a>
              </li>
            </ul>
          </div>

          {/* 소셜 */}
          <div>
            <h4 className="font-semibold text-white mb-4">팔로우</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-neutral-800/50 hover:bg-neon-blue/20 flex items-center justify-center text-neutral-400 hover:text-neon-blue transition-all"
              >
                𝕏
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-neutral-800/50 hover:bg-neon-blue/20 flex items-center justify-center text-neutral-400 hover:text-neon-blue transition-all"
              >
                f
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-neutral-800/50 hover:bg-neon-blue/20 flex items-center justify-center text-neutral-400 hover:text-neon-blue transition-all"
              >
                in
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-400">
          <p>&copy; 2026 TechGuide. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              개인정보
            </a>
            <a href="#" className="hover:text-white transition-colors">
              약관
            </a>
            <a href="#" className="hover:text-white transition-colors">
              연락처
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
