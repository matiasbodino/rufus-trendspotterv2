import { qualifySignal, generateTrendCard, QualifyResult } from "./claude"
import { notifyTrendToClientChannels } from "./slack"
import { TrendCard, Platform, Market, ActivationWindow, BriefFormat, ClientFit } from "./types"
import { prisma } from "./prisma"

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
 * Full pipeline: raw signal → qualify → trend card → save to DB → notify
 * Returns the trend if it qualifies, null otherwise
 */
export async function processSignal(signal: RawSignal): Promise<TrendCard | null> {
  // Step 0: Save raw signal to DB
  let rawSignal
  try {
    rawSignal = await prisma.rawSignal.upsert({
      where: {
        platform_externalId: {
          platform: signal.platform,
          externalId: signal.id,
        },
      },
      update: {
        title: signal.title,
        description: signal.description,
        metrics: signal.metrics as any,
        url: signal.url,
      },
      create: {
        platform: signal.platform,
        externalId: signal.id,
        title: signal.title,
        description: signal.description,
        metrics: signal.metrics as any,
        url: signal.url,
        market: signal.market,
      },
    })
  } catch (err) {
    console.error(`Failed to save raw signal "${signal.title}":`, err)
    return null
  }

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
    await prisma.rawSignal.update({
      where: { id: rawSignal.id },
      data: { processed: true },
    })
    return null
  }

  if (!qualification.califica) {
    console.log(`Signal "${signal.title}" does not qualify (score: ${qualification.score})`)
    await prisma.rawSignal.update({
      where: { id: rawSignal.id },
      data: { processed: true },
    })
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

  // Step 3: Find matching clients from DB
  const dbClients = await prisma.client.findMany({
    where: {
      name: { in: qualification.clientes_fit },
      active: true,
    },
  })

  const clients: ClientFit[] = dbClients.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
  }))

  // Step 4: Save trend to DB
  let dbTrend
  try {
    dbTrend = await prisma.trend.create({
      data: {
        name: trendCardData.name,
        platform: signal.platform,
        score: qualification.score,
        growthSpeed: qualification.growthSpeed,
        activationWindow: qualification.ventana,
        categoryFit: qualification.categoryFit,
        description: trendCardData.description,
        manifestation: trendCardData.manifestation,
        examples: trendCardData.examples,
        whyNow: trendCardData.whyNow,
        recommendedFormat: trendCardData.recommendedFormat,
        status: "NEW",
        market: signal.market,
        rawSignalId: rawSignal.id,
        trendClients: {
          create: dbClients.map((c) => ({
            clientId: c.id,
          })),
        },
      },
    })

    // Mark raw signal as processed
    await prisma.rawSignal.update({
      where: { id: rawSignal.id },
      data: { processed: true },
    })
  } catch (err) {
    console.error(`Failed to save trend "${trendCardData.name}" to DB:`, err)
    return null
  }

  // Build TrendCard for return/notification
  const trend: TrendCard = {
    id: dbTrend.id,
    name: dbTrend.name,
    platform: dbTrend.platform as Platform,
    score: dbTrend.score,
    growthSpeed: dbTrend.growthSpeed,
    activationWindow: dbTrend.activationWindow as ActivationWindow,
    categoryFit: dbTrend.categoryFit,
    description: dbTrend.description,
    manifestation: dbTrend.manifestation,
    examples: dbTrend.examples || "",
    whyNow: dbTrend.whyNow,
    recommendedFormat: dbTrend.recommendedFormat as BriefFormat,
    status: "NEW",
    market: dbTrend.market as Market,
    clients,
    createdAt: dbTrend.createdAt.toISOString(),
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
