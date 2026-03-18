import { TrendCard, PLATFORM_LABELS, WINDOW_CONFIG, FORMAT_LABELS } from "./types"

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
        { type: "mrkdwn", text: `*Formato sugerido:* ${formatLabel}` },
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
          url: `${process.env.NEXTAUTH_URL || "http://localhost:3002"}/dashboard?trend=${trend.id}`,
          action_id: "view_trend",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "⚡ Generar brief" },
          url: `${process.env.NEXTAUTH_URL || "http://localhost:3002"}/dashboard?trend=${trend.id}&brief=true`,
          action_id: "generate_brief",
          style: "primary",
        },
      ],
    },
  ]

  // Send to each client channel that has fit
  for (const client of trend.clients) {
    const channel = CLIENT_CHANNELS[client.name]
    if (channel) {
      await postToSlack(channel, blocks)
    }
  }
}

export async function sendDailyDigest(trends: TrendCard[]): Promise<boolean> {
  if (!GENERAL_CHANNEL) return false

  const today = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const trendLines = trends
    .slice(0, 5)
    .map((t, i) => {
      const clients = t.clients.map((c) => c.name).join(", ")
      const windowEmoji = t.activationWindow === "URGENTE" ? "🔴" : t.activationWindow === "NORMAL" ? "🟡" : "⚪"
      return `${i + 1}. *${t.name}* — ${PLATFORM_LABELS[t.platform]} — Score: ${t.score.toFixed(1)} — Fit: ${clients} ${windowEmoji}`
    })
    .join("\n")

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🔥 Trendspotter — ${today}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Las ${Math.min(5, trends.length)} tendencias más relevantes de las últimas 24hs*\n\n${trendLines}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "→ Ver todas en Trendspotter" },
          url: `${process.env.NEXTAUTH_URL || "http://localhost:3002"}/dashboard`,
          action_id: "view_all",
        },
      ],
    },
  ]

  return postToSlack(GENERAL_CHANNEL, blocks)
}
