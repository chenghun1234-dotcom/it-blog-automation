import { NextResponse } from 'next/server';
import axios from 'axios';

interface HNStory {
  title: string;
  url: string;
  score: number;
  id: number;
  by: string;
  time: number;
}

const BASE_URL = 'https://hacker-news.firebaseio.com/v0';
const CACHE_DURATION = 60 * 60 * 1000; // 1시간

let cachedData: { stories: HNStory[]; timestamp: number } | null = null;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // 캐시 확인
    const now = Date.now();
    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData.stories.slice(0, limit),
        cached: true,
      });
    }

    // Hacker News 인기글 ID 목록 가져오기
    const topStoriesResponse = await axios.get(`${BASE_URL}/topstories.json`, {
      timeout: 5000,
    });

    const storyIds = topStoriesResponse.data.slice(0, limit);
    const stories: HNStory[] = [];

    // 각 ID별 상세 정보 병렬 처리
    const storyPromises = storyIds.map((id: number) =>
      axios.get(`${BASE_URL}/item/${id}.json`, { timeout: 3000 }).catch(() => null)
    );

    const responses = await Promise.all(storyPromises);

    for (let i = 0; i < responses.length; i++) {
      try {
        const response = responses[i];
        if (response) {
          const itemData = response.data;

          if (itemData && itemData.type === 'story') {
            stories.push({
              title: itemData.title || '제목 없음',
              url: itemData.url || `https://news.ycombinator.com/item?id=${storyIds[i]}`,
              score: itemData.score || 0,
              id: itemData.id,
              by: itemData.by || 'Anonymous',
              time: itemData.time || Date.now() / 1000,
            });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch story ${storyIds[i]}:`, error);
      }
    }

    // 캐시 업데이트
    cachedData = {
      stories,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: stories,
      cached: false,
    });
  } catch (error) {
    console.error('Hacker News API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Hacker News data' },
      { status: 500 }
    );
  }
}
