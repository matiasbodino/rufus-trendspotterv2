import { qualifySignal, generateTrendCard, QualifyResult } from "./claude"
import { notifyTrendToClientChannels } from "./slack"
import { TrendCard, Platform, Market, ActivationWindow, BriefFormat, ClientFit } from "./types"
import { MOCK_CLIENTS } from "./mock-data"

interface RawSignal {
  id: string
  title: string
  description: string
  platform: Platform
  metrics: Record<string, unknown>
  market: Market
  url?: string
}

/**
 * Full pipeline: raw signal → qualify → trend card → notify
 * Returns the trend if it qualifies, null otherwise
 */
export async function processSignal(signal: RawSignal): Promise<TrendCard | null> {
  // Step 1: Qualify with Claude
  let qualification: QualifyResult
  try {
    qualification = await qualifySignal({
      title: signal.title,
      description: signal.description,
      platform: signal.platform,
      metrics: signal.metrics,
      market: signal.market,
    })
  } catch (err) {
    console.error(`Failed to qualify signal "${signal.title}":`, err)
    return null
  }

  if (!qualification.califica) {
    console.log(`Signal "${signal.title}" does not qualify (score: ${qualification.score})`)
    return null
  }

  // Step 2: Generate trend card with Claude
  let trendCardData
  try {
    trendCardData = await generateTrendCard({
      title: signal.title,
      description: signal.description,
      platform: signal.platform,
      metrics: signal.metrics,
      market: signal.market,
      qualification,
    })
  } catch (err) {
    console.error(`Failed to generate trend card for "${signal.title}":`, err)
    return null
  }

  // Step 3: Map client names to client objects
  const clients: ClientFit[] = qualification.clientes_fit
    .map((name) => {
      const client = MOCK_CLIENTS.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      )
      return client ? { id: client.id, name: client.name, category: client.category } : null
    })
    .filter((c): c is ClientFit => c !== null)

  // Step 4: Build TrendCard
  const trend: TrendCard = {
    id: `trend_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: trendCardData.name,
    platform: signal.platform,
    score: qualification.score,
    growthSpeed: qualification.growthSpeed,
    activationWindow: qualification.ventana as ActivationWindow,
    categoryFit: qualification.categoryFit,
    description: trendCardData.description,
    manifestation: trendCardData.manifestation,
    examples: trendCardData.examples,
    whyNow: trendCardData.whyNow,
    recommendedFormat: trendCardData.recommendedFormat as BriefFormat,
    status: "NEW",
    market: signal.market,
    clients,
    createdAt: new Date().toISOString(),
  }

  // Step 5: Notify Slack channels
  if (clients.length > 0) {
    try {
      await notifyTrendToClientChannels(trend)
    } catch (err) {
      console.error("Failed to notify Slack:", err)
    }
  }

  return trend
}
