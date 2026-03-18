export interface TikTokTrend {
  id: string
  title: string
  description: string
  hashtag: string
  videoCount: number
  viewCount: number
  url: string
}

export async function fetchTikTokTrends(market: "ARG" | "MX" = "ARG"): Promise<TikTokTrend[]> {
  const token = process.env.TIKTOK_ACCESS_TOKEN

  if (!token) {
    console.warn("TikTok access token not configured, using fallback")
    return []
  }

  const countryCode = market === "ARG" ? "AR" : "MX"

  try {
    // TikTok Creative Center - trending hashtags
    const res = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/creative/hashtag/trending/?country_code=${countryCode}&limit=20`,
      {
        headers: {
          "Access-Token": token,
          "Content-Type": "application/json",
        },
      }
    )

    if (!res.ok) {
      console.error(`TikTok API error: ${res.status}`)
      return []
    }

    const data = await res.json()

    if (data.code !== 0 || !data.data?.list) {
      console.error("TikTok API response error:", data.message)
      return []
    }

    return data.data.list.map((item: {
      hashtag_id: string
      hashtag_name: string
      video_count: number
      view_count: number
    }) => ({
      id: `tt_${item.hashtag_id}`,
      title: `#${item.hashtag_name}`,
      description: `Hashtag trending en TikTok ${market} con ${formatNumber(item.video_count)} videos`,
      hashtag: item.hashtag_name,
      videoCount: item.video_count,
      viewCount: item.view_count,
      url: `https://www.tiktok.com/tag/${item.hashtag_name}`,
    }))
  } catch (err) {
    console.error("Error fetching TikTok trends:", err)
    return []
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
