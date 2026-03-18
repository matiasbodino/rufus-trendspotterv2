export interface PinterestTrend {
  id: string
  keyword: string
  normalizedKeyword: string
  percentChange: number
  url: string
}

export async function fetchPinterestTrends(market: "ARG" | "MX" = "ARG"): Promise<PinterestTrend[]> {
  const token = process.env.PINTEREST_ACCESS_TOKEN

  if (!token) {
    console.warn("Pinterest access token not configured")
    return []
  }

  const region = market === "ARG" ? "AR" : "MX"

  try {
    const res = await fetch(
      `https://api.pinterest.com/v5/trends/keywords/${region}?limit=25`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!res.ok) {
      console.error(`Pinterest API error: ${res.status}`)
      return []
    }

    const data = await res.json()

    if (!data.items) return []

    return data.items.map((item: {
      keyword: string
      normalized_keyword: string
      percent_change: number
    }) => ({
      id: `pin_${Buffer.from(item.keyword).toString("base64").slice(0, 12)}`,
      keyword: item.keyword,
      normalizedKeyword: item.normalized_keyword,
      percentChange: item.percent_change || 0,
      url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(item.keyword)}`,
    }))
  } catch (err) {
    console.error("Error fetching Pinterest trends:", err)
    return []
  }
}
