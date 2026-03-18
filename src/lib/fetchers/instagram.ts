export interface InstagramHashtag {
  id: string
  name: string
  mediaCount: number
  url: string
}

export async function fetchInstagramTrends(
  keywords: string[] = [
    "tendencia",
    "viral",
    "trendarg",
    "argentinahoy",
    "reelsargentina",
    "foodtok",
    "recetasfaciles",
    "outfitdeldia",
    "viajarbien",
  ]
): Promise<InstagramHashtag[]> {
  const token = process.env.META_ACCESS_TOKEN

  if (!token) {
    console.warn("Meta access token not configured")
    return []
  }

  const results: InstagramHashtag[] = []

  for (const keyword of keywords) {
    try {
      // Search for hashtag ID
      const searchRes = await fetch(
        `https://graph.facebook.com/v18.0/ig_hashtag_search?q=${encodeURIComponent(keyword)}&user_id=${process.env.META_USER_ID || ""}&access_token=${token}`
      )

      if (!searchRes.ok) continue

      const searchData = await searchRes.json()
      if (!searchData.data?.[0]?.id) continue

      const hashtagId = searchData.data[0].id

      // Get hashtag info
      const infoRes = await fetch(
        `https://graph.facebook.com/v18.0/${hashtagId}?fields=id,name,media_count&user_id=${process.env.META_USER_ID || ""}&access_token=${token}`
      )

      if (!infoRes.ok) continue

      const infoData = await infoRes.json()

      results.push({
        id: `ig_${infoData.id}`,
        name: infoData.name,
        mediaCount: infoData.media_count || 0,
        url: `https://www.instagram.com/explore/tags/${infoData.name}/`,
      })

      // Rate limiting
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      console.error(`Error fetching IG hashtag "${keyword}":`, err)
    }
  }

  return results.sort((a, b) => b.mediaCount - a.mediaCount)
}
