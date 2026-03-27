'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HNStory {
  title: string;
  url: string;
  score: number;
  id: number;
  by: string;
  time: number;
}

interface DevToArticle {
  title: string;
  description: string;
  url: string;
  id: number;
  author: string;
  publishedAt: string;
  readingTimeMinutes: number;
  reactionsCount: number;
}

const getScoreRate = (story: HNStory, maxScore: number) => {
  const rate = maxScore > 0 ? Math.min(100, Math.round((story.score / maxScore) * 100)) : 0;
  return rate;
};

const getReactionsRate = (article: DevToArticle, maxReaction: number) => {
  const rate = maxReaction > 0 ? Math.min(100, Math.round((article.reactionsCount / maxReaction) * 100)) : 0;
  return rate;
};

export default function TrendingWidget() {
  const [hnStories, setHnStories] = useState<HNStory[]>([]);
  const [devtoArticles, setDevtoArticles] = useState<DevToArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setLoading(true);

        const [hnRes, devtoRes] = await Promise.all([
          fetch('/api/trending/hackernews?limit=5'),
          fetch('/api/trending/devto?tag=javascript&limit=3'),
        ]);

        if (!hnRes.ok || !devtoRes.ok) throw new Error('API 요청 실패');

        const hnData = await hnRes.json();
        const devtoData = await devtoRes.json();

        if (hnData.success) setHnStories(hnData.data);
        if (devtoData.success) setDevtoArticles(devtoData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-6 backdrop-blur-lg">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={`pulse-${i}`} className="h-10 rounded bg-neutral-800"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/50 p-6 backdrop-blur-lg">
        <p className="text-center text-sm text-red-400">⚠️ {error}</p>
      </div>
    );
  }

  const hnMaxScore = Math.max(...hnStories.map((story) => story.score), 1);
  const devtoMaxReaction = Math.max(...devtoArticles.map((article) => article.reactionsCount), 1);

  const totalHnScore = hnStories.reduce((sum, item) => sum + item.score, 0);
  const totalDevtoReactions = devtoArticles.reduce((sum, item) => sum + item.reactionsCount, 0);

  return (
    <section className="rounded-2xl border border-neon-blue/20 bg-gradient-to-br from-neutral-900/90 to-neutral-950/80 p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">📊 인포그래픽 트렌드 센터</h3>
          <p className="text-xs text-neutral-400">Hacker News, Dev.to 최신 통계 데이터를 시각화합니다</p>
        </div>
        <span className="text-xs text-neon-green/90 font-semibold">LAST UPDATED: {new Date().toLocaleTimeString('ko-KR')}</span>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-400">Hacker News Top Stories</p>
          <h4 className="text-2xl font-bold text-neon-blue mt-1">{hnStories.length}</h4>
          <p className="text-xs text-neutral-400">최근 캐시: 1시간</p>
          <div className="mt-3 h-20 rounded-xl bg-[linear-gradient(90deg,_rgba(0,240,255,0.2),_rgba(112,0,255,0.2))] p-3">
            <p className="text-xs text-white">총 스코어: {totalHnScore}</p>
            <div className="mt-2 flex gap-2">
              {hnStories.map((story) => (
                <span key={`bar-${story.id}`} className="flex-1">
                  <div className="h-2 rounded-full bg-neutral-800" style={{ width: `${getScoreRate(story, hnMaxScore)}%` }} />
                  <p className="mt-1 text-[10px] text-neutral-300 truncate">{story.title}</p>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
          <p className="text-xs uppercase tracking-wider text-neutral-400">Dev.to Popular Articles</p>
          <h4 className="text-2xl font-bold text-neon-purple mt-1">{devtoArticles.length}</h4>
          <p className="text-xs text-neutral-400">최근 반응: {totalDevtoReactions}</p>
          <div className="mt-3 h-20 rounded-xl bg-[linear-gradient(90deg,_rgba(112,0,255,0.2),_rgba(0,255,102,0.2))] p-3">
            <div className="mt-2 space-y-1">
              {devtoArticles.map((article) => (
                <div key={`bar-devto-${article.id}`}>
                  <p className="text-[10px] text-neutral-300 truncate">{article.title}</p>
                  <div className="h-2 w-full rounded-full bg-neutral-800">
                    <div className="h-2 rounded-full bg-neon-purple" style={{ width: `${getReactionsRate(article, devtoMaxReaction)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
        <div className="rounded-lg bg-neutral-900/50 p-3">
          <p className="font-semibold text-white">Hacker News 최고 스토리</p>
          {hnStories.slice(0, 1).map((story) => (
            <p key={`top-${story.id}`} className="truncate">{story.title}</p>
          ))}
        </div>
        <div className="rounded-lg bg-neutral-900/50 p-3">
          <p className="font-semibold text-white">Dev.to 최고 반응</p>
          {devtoArticles.slice(0, 1).map((article) => (
            <p key={`top-devto-${article.id}`} className="truncate">{article.title}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
