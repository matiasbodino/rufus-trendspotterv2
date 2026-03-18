export type Platform = "tiktok" | "instagram" | "pinterest" | "google_trends" | "x" | "reddit"

export type Market = "ARG" | "MX"

export type TrendStatus = "NEW" | "EVALUATING" | "ACTIVATED" | "DISCARDED"

export type BriefFormat = "ESTATICA" | "UGC" | "AD" | "VIDEO_ANIMADO"

export type ActivationWindow = "URGENTE" | "NORMAL" | "PUEDE_ESPERAR"

export interface TrendCard {
  id: string
  name: string
  platform: Platform
  score: number
  growthSpeed: number
  activationWindow: ActivationWindow
  categoryFit: number
  description: string
  manifestation: string
  examples: string | null
  whyNow: string
  recommendedFormat: BriefFormat | null
  status: TrendStatus
  market: Market
  clients: ClientFit[]
  createdAt: string
}

export interface ClientFit {
  id: string
  name: string
  category: string
}

export interface Brief {
  id: string
  trendId: string
  clientId: string | null
  format: BriefFormat
  content: string
  figmaFrameUrl: string | null
  createdAt: string
}

export interface Client {
  id: string
  name: string
  category: string
  slackChannelId: string | null
  market: Market
  active: boolean
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  pinterest: "Pinterest",
  google_trends: "Google Trends",
  x: "X (Twitter)",
  reddit: "Reddit",
}

export const STATUS_CONFIG: Record<TrendStatus, { emoji: string; label: string; color: string }> = {
  NEW: { emoji: "🆕", label: "Nueva", color: "bg-blue-500/20 text-blue-400" },
  EVALUATING: { emoji: "🔍", label: "En evaluación", color: "bg-yellow-500/20 text-yellow-400" },
  ACTIVATED: { emoji: "✅", label: "Activada", color: "bg-green-500/20 text-green-400" },
  DISCARDED: { emoji: "❌", label: "Descartada", color: "bg-red-500/20 text-red-400" },
}

export const WINDOW_CONFIG: Record<ActivationWindow, { label: string; color: string }> = {
  URGENTE: { label: "Urgente (24-48hs)", color: "text-red-400" },
  NORMAL: { label: "Normal (1 semana)", color: "text-yellow-400" },
  PUEDE_ESPERAR: { label: "Puede esperar", color: "text-gray-400" },
}

export const FORMAT_LABELS: Record<BriefFormat, string> = {
  ESTATICA: "Estática",
  UGC: "UGC",
  AD: "Ad",
  VIDEO_ANIMADO: "Video Animado",
}

export const CATEGORIES = [
  "ecommerce",
  "fintech",
  "food_bev",
  "entretenimiento",
  "travel",
  "retail",
  "delivery",
] as const
