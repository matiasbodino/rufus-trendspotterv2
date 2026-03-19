/**
 * Reddit public fetcher — no API key needed
 * Uses Reddit's public JSON endpoints
 */

export interface RedditPost {
  id: string
  title: string
  description: string
  subreddit: string
  score: number
  comments: number
  url: string
  permalink: string
}

const SUBREDDITS_ARG = [
  "argentina",
  "dankgentina",
  "ArgenBeans",
  "Argaming",
]

const SUBREDDITS_MX = [
  "mexico",
  "memexico",
  "MexicoCity",
]

export async function fetchRedditHot(market: "ARG" | "MX" = "ARG"): Promise<RedditPost[]> {
  const subreddits = market === "ARG" ? SUBREDDITS_ARG : SUBREDDITS_MX
  const allPosts: RedditPost[] = []

  for (const sub of subreddits) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
        {
          headers: {
            "User-Agent": "RufusTrendspotter/1.0 (trend detection tool)",
          },
        }
      )

      if (!res.ok) {
        console.warn(`Reddit r/${sub} failed: ${res.status}`)
        continue
      }

      const data = await res.json()
      const posts = data?.data?.children || []

      for (const post of posts) {
        const d = post.data
        if (!d || d.stickied) continue // Skip pinned posts

        allPosts.push({
          id: `reddit_${d.id}`,
          title: d.title,
          description: d.selftext?.slice(0, 300) || d.title,
          subreddit: d.subreddit,
          score: d.score || 0,
          comments: d.num_comments || 0,
          url: d.url,
          permalink: `https://reddit.com${d.permalink}`,
        })
      }

      // Small delay between subreddits
      await new Promise((r) => setTimeout(r, 500))
    } catch (err) {
      console.error(`Error fetching r/${sub}:`, err)
    }
  }

  // Sort by score and return top posts
  return allPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
}
