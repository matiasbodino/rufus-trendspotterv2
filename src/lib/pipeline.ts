import { qualifySignal, generateTrendCard, QualifyResult } from "./claude"
import { notifyTrendToClientChannels } from "./slack"
import { TrendCard, Platform, Market, ActivationWindow, Durability, BriefFormat, ClientFit } from "./types"
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

  // Check if already processed into a trend
  const existingTrend = await prisma.trend.findUnique({
    where: { rawSignalId: rawSignal.id },
  })
  if (existingTrend) {
    console.log(`Signal "${signal.title}" already processed as trend "${existingTrend.name}"`)
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
    console.log(`Signal "${signal.title}" does not qualify (score: ${qualification.score}, reason: ${qualification.razon})`)
    await prisma.rawSignal.update({
      where: { id: rawSignal.id },
      data: { processed: true },
    })
    return null
  }

  console.log(`✅ Signal "${signal.title}" QUALIFIES (score: ${qualification.score})`)

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

  // Step 3: Suggest potential client fits (optional, just tags)
  const potentialClients = (qualification as any).clientes_potenciales || []
  const dbClients = potentialClients.length > 0
    ? await prisma.client.findMany({
        where: {
          name: { in: potentialClients },
          active: true,
        },
      })
    : []

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
        durability: (qualification as any).durability || "DAYS",
        categoryFit: (qualification as any).culturalRelevance || qualification.categoryFit || 5,
        description: trendCardData.description,
        manifestation: trendCardData.manifestation,
        examples: trendCardData.examples,
        whyNow: trendCardData.whyNow,
        recommendedFormat: trendCardData.recommendedFormat,
        creativeAngle: trendCardData.creativeAngle || null,
        tags: trendCardData.tags || [],
        status: "NEW",
        market: signal.market,
        rawSignalId: rawSignal.id,
        trendClients: dbClients.length > 0
          ? {
              create: dbClients.map((c) => ({
                clientId: c.id,
              })),
            }
          : undefined,
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
    durability: (dbTrend as any).durability as Durability || "DAYS",
    categoryFit: dbTrend.categoryFit,
    description: dbTrend.description,
    manifestation: dbTrend.manifestation,
    examples: dbTrend.examples || "",
    whyNow: dbTrend.whyNow,
    recommendedFormat: dbTrend.recommendedFormat as BriefFormat,
    creativeAngle: (dbTrend as any).creativeAngle || null,
    tags: (dbTrend as any).tags || [],
    status: "NEW",
    market: dbTrend.market as Market,
    clients,
    createdAt: dbTrend.createdAt.toISOString(),
  }

  // Step 5: Notify Slack (if configured)
  if (clients.length > 0) {
    try {
      await notifyTrendToClientChannels(trend)
    } catch (err) {
      console.error("Failed to notify Slack:", err)
    }
  }

  return trend
}
