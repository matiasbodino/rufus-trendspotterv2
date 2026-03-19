import { qualifySignal, generateTrendCard, matchClientFit, QualifyResult, ClientProfile } from "./claude"
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

  // Step 3: Match client fit using brand profiles
  const allClients = await prisma.client.findMany({ where: { active: true } })
  let clientFits: { clientId: string; fitLevel: string; fitReason: string }[] = []

  if (allClients.length > 0) {
    try {
      const profiles: ClientProfile[] = allClients.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        audienceAge: c.audienceAge,
        toneOfVoice: c.toneOfVoice,
        brandTerritory: c.brandTerritory,
        prohibitedTopics: c.prohibitedTopics,
        activePlatforms: c.activePlatforms || [],
        brandContext: c.brandContext,
      }))

      const fitResults = await matchClientFit(
        { name: trendCardData.name, description: trendCardData.description, platform: signal.platform, tags: trendCardData.tags },
        profiles
      )

      // Map Claude's response back to real client IDs
      clientFits = fitResults
        .map((fit) => {
          const dbClient = allClients.find((c) => c.name.toLowerCase() === fit.clientName.toLowerCase() || c.id === fit.clientId)
          if (!dbClient) return null
          return { clientId: dbClient.id, fitLevel: fit.fitLevel, fitReason: fit.reason }
        })
        .filter(Boolean) as { clientId: string; fitLevel: string; fitReason: string }[]
    } catch (err) {
      console.error("Failed to match client fit:", err)
    }
  }

  const clients: ClientFit[] = clientFits.map((f) => {
    const c = allClients.find((cl) => cl.id === f.clientId)!
    return { id: c.id, name: c.name, category: c.category, fitLevel: f.fitLevel as any, fitReason: f.fitReason }
  })

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
        categoryFit: (qualification as any).culturalRelevance || (qualification as any).categoryFit || 5,
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
        trendClients: clientFits.length > 0
          ? {
              create: clientFits.map((f) => ({
                clientId: f.clientId,
                fitLevel: f.fitLevel,
                fitReason: f.fitReason,
                addedBy: "claude",
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
