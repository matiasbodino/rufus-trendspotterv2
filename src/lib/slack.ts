import { TrendCard, PLATFORM_LABELS, WINDOW_CONFIG, FORMAT_LABELS, DURABILITY_CONFIG, Durability } from "./types"

const CLIENT_CHANNELS: Record<string, string> = {
  MercadoLibre: process.env.SLACK_CHANNEL_MERCADOLIBRE || "",
  Danone: process.env.SLACK_CHANNEL_DANONE || "",
  Disney: process.env.SLACK_CHANNEL_DISNEY || "",
  Rappi: process.env.SLACK_CHANNEL_RAPPI || "",
  Despegar: process.env.SLACK_CHANNEL_DESPEGAR || "",
  PedidosYa: process.env.SLACK_CHANNEL_PEDIDOSYA || "",
  CCU: process.env.SLACK_CHANNEL_CCU || "",
  NaranjaX: process.env.SLACK_CHANNEL_NARANJAX || "",
}

const GENERAL_CHANNEL = process.env.SLACK_CHANNEL_GENERAL || ""

async function postToSlack(channel: string, blocks: unknown[]): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token || !channel) return false

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel, blocks }),
    })

    const data = await res.json()
    if (!data.ok) {
      console.error("Slack error:", data.error)
      return false
    }
    return true
  } catch (err) {
    console.error("Slack post error:", err)
    return false
  }
}

export async function notifyTrendToClientChannels(trend: TrendCard): Promise<void> {
  const windowCfg = WINDOW_CONFIG[trend.activationWindow]
  const formatLabel = trend.recommendedFormat ? FORMAT_LABELS[trend.recommendedFormat] : "Por definir"
  const durLabel = trend.durability ? DURABILITY_CONFIG[trend.durability as Durability]?.label || "" : ""

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🔥 Nueva tendencia: ${trend.name}`,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Plataforma:* ${PLATFORM_LABELS[trend.platform]}` },
        { type: "mrkdwn", text: `*Score:* ${trend.score.toFixed(1)}/10` },
        { type: "mrkdwn", text: `*Ventana:* ${windowCfg.label}` },
        { type: "mrkdwn", text: `*Durabilidad:* ${durLabel}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: trend.description,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "📋 Ver ficha" },
          url: `${process.env.NEXTAUTH_URL || "https://rufus-trendspotter.vercel.app"}/dashboard?trend=${trend.id}`,
          action_id: "view_trend",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "⚡ Generar brief" },
          url: `${process.env.NEXTAUTH_URL || "https://rufus-trendspotter.vercel.app"}/dashboard?trend=${trend.id}&brief=true`,
          action_id: "generate_brief",
          style: "primary",
        },
      ],
    },
  ]

  for (const client of trend.clients) {
    const channel = CLIENT_CHANNELS[client.name]
    if (channel) {
      await postToSlack(channel, blocks)
    }
  }
}

/**
 * Daily digest with conversational tone — like a Creative Strategist briefing the team
 */
export async function sendDailyDigest(trends: TrendCard[]): Promise<boolean> {
  if (!GENERAL_CHANNEL) return false

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const urgentCount = trends.filter((t) => t.activationWindow === "URGENTE").length
  const flashCount = trends.filter((t) => t.durability === "FLASH").length

  // Conversational opener based on what's happening
  let opener = `Buenos días equipo 👋 Acá va lo que está pasando hoy.`
  if (urgentCount >= 2) {
    opener = `🚨 Atención equipo — hay ${urgentCount} tendencias urgentes hoy. Ventana corta, hay que decidir rápido.`
  } else if (trends.length === 0) {
    opener = `Día tranquilo — no detectamos tendencias fuertes en las últimas 24hs. Buen momento para producción.`
  } else if (flashCount >= 2) {
    opener = `⚡ Día de reacción rápida — hay ${flashCount} tendencias flash que duran horas, no días.`
  }

  const trendLines = trends
    .slice(0, 5)
    .map((t, i) => {
      const durEmoji = t.durability === "FLASH" ? "⚡" : t.durability === "WEEKS" ? "📈" : "📅"
      const windowEmoji = t.activationWindow === "URGENTE" ? "🔴" : t.activationWindow === "NORMAL" ? "🟡" : "⚪"
      return `${windowEmoji} *${t.name}*\n      ${PLATFORM_LABELS[t.platform]} · Score ${t.score.toFixed(1)} · ${durEmoji} ${t.durability || "DAYS"}\n      _${t.description.slice(0, 100)}..._`
    })
    .join("\n\n")

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `☀️ Morning Brief — ${today}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: opener,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: trendLines || "_Sin tendencias relevantes hoy._",
      },
    },
    { type: "divider" },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📊 ${trends.length} tendencias detectadas · ${urgentCount} urgentes · ${flashCount} flash`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "🚀 Abrir Trendspotter" },
          url: `${process.env.NEXTAUTH_URL || "https://rufus-trendspotter.vercel.app"}/dashboard`,
          action_id: "view_all",
          style: "primary",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "⚡ Sprint Mode" },
          url: `${process.env.NEXTAUTH_URL || "https://rufus-trendspotter.vercel.app"}/dashboard/sprint`,
          action_id: "sprint_mode",
        },
      ],
    },
  ]

  return postToSlack(GENERAL_CHANNEL, blocks)
}

/**
 * Send a specific brief to a Slack channel
 */
export async function sendBriefToChannel(
  channelId: string,
  trendName: string,
  briefContent: string,
  format: string
): Promise<boolean> {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📋 Brief: ${trendName}`,
      },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `*Formato:* ${format} · Generado desde Trendspotter` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: briefContent.length > 2900 ? briefContent.slice(0, 2900) + "..." : briefContent,
      },
    },
  ]

  return postToSlack(channelId, blocks)
}
