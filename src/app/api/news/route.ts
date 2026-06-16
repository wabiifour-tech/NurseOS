import { NextResponse } from 'next/server'

// In-memory cache for 1 hour
let cachedNews: {
  data: NewsItem[]
  timestamp: number
} | null = null

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in ms

interface NewsItem {
  title: string
  summary: string
  source: string
  url: string
  date: string
  category: string
}

const CATEGORY_QUERIES: Record<string, string> = {
  'NMCN Updates': 'Nursing Midwifery Council Nigeria NMCN update 2025',
  'WHO News': 'WHO World Health Organization healthcare news 2025',
  'NCLEX Updates': 'NCLEX nursing exam updates changes 2025',
  'Job Opportunities': 'nursing healthcare jobs Nigeria 2025',
  'Conferences': 'nursing healthcare conference Africa 2025',
  'Healthcare Tech': 'healthcare technology digital health nursing 2025',
}

function categorizeResult(name: string, snippet: string): string {
  const text = `${name} ${snippet}`.toLowerCase()
  if (text.includes('nmcn') || text.includes('midwifery council') || text.includes('nursing council nigeria')) return 'NMCN Updates'
  if (text.includes('who ') || text.includes('world health')) return 'WHO News'
  if (text.includes('nclex') || text.includes('nursing exam')) return 'NCLEX Updates'
  if (text.includes('job') || text.includes('hiring') || text.includes('vacancy') || text.includes('recruitment')) return 'Job Opportunities'
  if (text.includes('conference') || text.includes('summit') || text.includes('symposium') || text.includes('workshop')) return 'Conferences'
  if (text.includes('tech') || text.includes('digital') || text.includes('ai ') || text.includes('telemedicine') || text.includes('ehealth')) return 'Healthcare Tech'
  return 'Healthcare Tech'
}

export async function GET() {
  try {
    // Return cached data if still valid
    if (cachedNews && Date.now() - cachedNews.timestamp < CACHE_DURATION) {
      return NextResponse.json({ news: cachedNews.data, cached: true })
    }

    // Use z-ai-web-dev-sdk to search for healthcare news
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const allNews: NewsItem[] = []
    const seenUrls = new Set<string>()

    // Search across multiple queries for broader coverage
    const queries = [
      'latest nursing healthcare news Nigeria 2025',
      'NMCN WHO NCLEX nursing updates 2025',
      'healthcare technology nursing jobs Africa 2025',
    ]

    const results = await Promise.allSettled(
      queries.map(async (query) => {
        const results = await zai.functions.invoke('web_search', {
          query,
          num: 10,
        })
        return results as Array<{
          url: string
          name: string
          snippet: string
          host_name: string
          date?: string
        }>
      })
    )

    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      for (const item of result.value) {
        if (seenUrls.has(item.url)) continue
        seenUrls.add(item.url)

        allNews.push({
          title: item.name || 'Untitled',
          summary: item.snippet || '',
          source: item.host_name || 'Unknown',
          url: item.url,
          date: item.date || new Date().toISOString().split('T')[0],
          category: categorizeResult(item.name, item.snippet),
        })
      }
    }

    // Sort by date (newest first) and limit to 30 items
    const sortedNews = allNews
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)

    // Cache the results
    cachedNews = {
      data: sortedNews,
      timestamp: Date.now(),
    }

    return NextResponse.json({ news: sortedNews, cached: false })
  } catch (error) {
    console.error('Error fetching healthcare news:', error)

    // Return cached data even if expired, as fallback
    if (cachedNews) {
      return NextResponse.json({ news: cachedNews.data, cached: true, stale: true })
    }

    // No cache available — return an empty list with a 200 status so the
    // client can show a graceful "No news available yet" empty state
    // instead of an error screen. This handles transient failures such as
    // the upstream web_search rate limit (HTTP 429) without breaking the UI.
    return NextResponse.json(
      { news: [], cached: false, unavailable: true },
      { status: 200 }
    )
  }
}
