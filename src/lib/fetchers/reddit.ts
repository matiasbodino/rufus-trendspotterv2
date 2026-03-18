export interface RedditPost {
  id: string
  title: string
  selftext: string
  score: number
  upvote_ratio: number
  num_comments: number
  url: string
  subreddit: string
  created_utc: number
}

interface RedditTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Reddit credentials not configured")
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "RufusTrendspotter/1.0",
    },
    body: "grant_type=client_credentials",
  })

  if (!res.ok) {
    throw new Error(`Reddit auth failed: ${res.status}`)
  }

  const data: RedditTokenResponse = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

export async function fetchRedditTrending(market: "ARG" | "MX" = "ARG"): Promise<RedditPost[]> {
  const subreddits = market === "ARG"
    ? ["argentina", "dankgentina"]
    : ["mexico", "memexico"]

  const token = await getAccessToken()
  const allPosts: RedditPost[] = []

  for (const subreddit of subreddits) {
    try {
      const res = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/hot?limit=25`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "RufusTrendspotter/1.0",
          },
        }
      )

      if (!res.ok) continue

      const data = await res.json()
      const posts: RedditPost[] = data.data.children
        .map((child: { data: RedditPost }) => ({
          id: child.data.id,
          title: child.data.title,
          selftext: child.data.selftext?.slice(0, 500) || "",
          score: child.data.score,
          upvote_ratio: child.data.upvote_ratio,
          num_comments: child.data.num_comments,
          url: `https://reddit.com${child.data.url || ""}`,
          subreddit: child.data.subreddit,
          created_utc: child.data.created_utc,
        }))
        .filter((p: RedditPost) => {
          // Only posts from last 48h with decent engagement
          const age = (Date.now() / 1000) - p.created_utc
          return age < 48 * 60 * 60 && p.score > 50
        })

      allPosts.push(...posts)
    } catch (err) {
      console.error(`Error fetching r/${subreddit}:`, err)
    }
  }

  // Sort by score descending
  return allPosts.sort((a, b) => b.score - a.score).slice(0, 15)
}
