export interface GoogleTrendItem {
  id: string
  title: string
  description: string
  traffic: string
  relatedQueries: string[]
  url: string
}

export async function fetchGoogleTrends(market: "ARG" | "MX" = "ARG"): Promise<GoogleTrendItem[]> {
  const geo = market === "ARG" ? "AR" : "MX"

  try {
    // Google Trends daily trends RSS feed (no API key needed)
    const res = await fetch(
      `https://trends.google.com/trending/rss?geo=${geo}`,
      {
        headers: {
          "User-Agent": "RufusTrendspotter/1.0",
        },
      }
    )

    if (!res.ok) {
      console.error(`Google Trends fetch failed: ${res.status}`)
      return []
    }

    const xml = await res.text()
    return parseGoogleTrendsXML(xml)
  } catch (err) {
    console.error("Error fetching Google Trends:", err)
    return []
  }
}

function parseGoogleTrendsXML(xml: string): GoogleTrendItem[] {
  const items: GoogleTrendItem[] = []

  // Simple XML parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]

    const title = extractTag(itemXml, "title")
    const traffic = extractTag(itemXml, "ht:approx_traffic") || "0"
    const newsItemMatch = /<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/
    const newsMatch = newsItemMatch.exec(itemXml)
    const description = newsMatch ? newsMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").trim() : ""
    const link = extractTag(itemXml, "link") || ""

    if (title) {
      items.push({
        id: `gt_${Buffer.from(title).toString("base64").slice(0, 12)}`,
        title,
        description,
        traffic,
        relatedQueries: [],
        url: link,
      })
    }
  }

  return items.slice(0, 15)
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)
  const match = regex.exec(xml)
  return match ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").trim() : ""
}
