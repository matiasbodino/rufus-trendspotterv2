/**
 * TikTok Creative Center scraper — no API key needed
 * Fetches trending hashtags from the public Creative Center page
 */

export interface TikTokTrendItem {
  id: string
  title: string
  description: string
  hashtag: string
  popularity: number
  url: string
}

export async function fetchTikTokTrendingScraper(
  market: "ARG" | "MX" = "ARG"
): Promise<TikTokTrendItem[]> {
  const countryCode = market === "ARG" ? "AR" : "MX"

  try {
    // TikTok Creative Center public endpoint for trending hashtags
    const res = await fetch(
      `https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list?period=7&country_code=${countryCode}&page=1&limit=20&sort_by=popular`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          Referer: "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en",
        },
      }
    )

    if (!res.ok) {
      console.error(`TikTok Creative Center scrape failed: ${res.status}`)
      return await fetchTikTokTrendingFallback(market)
    }

    const data = await res.json()

    if (data.code !== 0 || !data.data?.list) {
      console.warn("TikTok Creative Center response issue, trying fallback")
      return await fetchTikTokTrendingFallback(market)
    }

    return data.data.list.map(
      (item: {
        hashtag_id: string
        hashtag_name: string
        video_count: number
        trend: number
      }) => ({
        id: `tt_${item.hashtag_id || item.hashtag_name}`,
        title: `#${item.hashtag_name}`,
        description: `Hashtag trending en TikTok ${market} — crecimiento: ${item.trend > 0 ? "+" : ""}${item.trend}%`,
        hashtag: item.hashtag_name,
        popularity: item.video_count || 0,
        url: `https://www.tiktok.com/tag/${item.hashtag_name}`,
      })
    )
  } catch (err) {
    console.error("Error scraping TikTok Creative Center:", err)
    return await fetchTikTokTrendingFallback(market)
  }
}

/**
 * Fallback: fetch TikTok trending from their Discover page API
 */
async function fetchTikTokTrendingFallback(
  market: "ARG" | "MX"
): Promise<TikTokTrendItem[]> {
  try {
    // Alternative: TikTok's public trending API
    const res = await fetch(
      "https://www.tiktok.com/api/discover/topictab/?from_page=search&keyword_id=",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }
    )

    if (!res.ok) {
      console.warn(`TikTok fallback also failed: ${res.status}`)
      return []
    }

    const data = await res.json()
    const topics = data?.data?.challenge_list || []

    return topics.slice(0, 15).map(
      (item: {
        cid: string
        cha_name: string
        desc: string
        view_count: number
      }) => ({
        id: `tt_${item.cid}`,
        title: `#${item.cha_name}`,
        description: item.desc || `Trending en TikTok ${market}`,
        hashtag: item.cha_name,
        popularity: item.view_count || 0,
        url: `https://www.tiktok.com/tag/${item.cha_name}`,
      })
    )
  } catch (err) {
    console.error("TikTok fallback error:", err)
    return []
  }
}
