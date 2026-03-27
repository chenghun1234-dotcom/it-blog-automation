import { NextResponse } from 'next/server';
import axios from 'axios';

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

const BASE_URL = 'https://dev.to/api';
const CACHE_DURATION = 60 * 60 * 1000;

let cachedData: { articles: DevToArticle[]; timestamp: number; tag: string; limit: number } | null = null;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag') || 'javascript';
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    const now = Date.now();
    if (
      cachedData &&
      now - cachedData.timestamp < CACHE_DURATION &&
      cachedData.tag === tag &&
      cachedData.limit === limit
    ) {
      return NextResponse.json({
        success: true,
        data: cachedData.articles,
        cached: true,
        tag,
      });
    }

    const response = await axios.get(`${BASE_URL}/articles`, {
      params: {
        tag,
        per_page: limit,
        state: 'fresh',
      },
      timeout: 5000,
    });

    const articles: DevToArticle[] = response.data.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      id: article.id,
      author: article.user?.name || 'Unknown',
      publishedAt: article.published_at,
      readingTimeMinutes: article.reading_time_minutes || 5,
      reactionsCount: article.reactions_count || 0,
    }));

    cachedData = {
      articles,
      timestamp: now,
      tag,
      limit,
    };

    return NextResponse.json({
      success: true,
      data: articles,
      cached: false,
      tag,
    });
  } catch (error) {
    console.error('Dev.to API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Dev.to articles' },
      { status: 500 }
    );
  }
}
