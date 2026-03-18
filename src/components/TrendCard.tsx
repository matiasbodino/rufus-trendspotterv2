"use client"

import {
  TrendCard as TrendCardType,
  PLATFORM_LABELS,
  STATUS_CONFIG,
  WINDOW_CONFIG,
  FORMAT_LABELS,
} from "@/lib/types"
import { Clock, TrendingUp, Users, ExternalLink } from "lucide-react"

interface TrendCardProps {
  trend: TrendCardType
  onSelect: (id: string) => void
}

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  return (
    <div className="w-full bg-white/5 rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full bg-gradient-to-r from-rufus-purple to-rufus-purple-light"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function platformIcon(platform: string): string {
  const icons: Record<string, string> = {
    tiktok: "🎵",
    instagram: "📸",
    pinterest: "📌",
    google_trends: "📈",
    x: "𝕏",
    reddit: "🤖",
  }
  return icons[platform] || "📊"
}

export default function TrendCardComponent({ trend, onSelect }: TrendCardProps) {
  const statusCfg = STATUS_CONFIG[trend.status]
  const windowCfg = WINDOW_CONFIG[trend.activationWindow]
  const timeSince = getTimeSince(trend.createdAt)

  return (
    <div
      onClick={() => onSelect(trend.id)}
      className="bg-rufus-card border border-rufus-border rounded-xl p-5 hover:border-rufus-purple/50 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{platformIcon(trend.platform)}</span>
            <span className="text-xs text-gray-500 uppercase">
              {PLATFORM_LABELS[trend.platform]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              {statusCfg.emoji} {statusCfg.label}
            </span>
          </div>
          <h3 className="text-white font-semibold text-base group-hover:text-rufus-purple-light transition-colors truncate">
            {trend.name}
          </h3>
        </div>

        {/* Score badge */}
        <div className="flex-shrink-0 ml-3">
          <div
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
              trend.score >= 8
                ? "bg-green-500/20 text-green-400"
                : trend.score >= 6
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            <span className="text-lg font-bold leading-none">{trend.score.toFixed(1)}</span>
            <span className="text-[9px] uppercase tracking-wider opacity-70">score</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{trend.description}</p>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">Crecimiento</span>
          </div>
          <ScoreBar value={trend.growthSpeed} />
          <span className="text-xs text-gray-400 mt-0.5 block">
            {trend.growthSpeed.toFixed(1)}/10
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">Ventana</span>
          </div>
          <span className={`text-xs font-medium ${windowCfg.color}`}>
            {windowCfg.label}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Users className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">Fit</span>
          </div>
          <ScoreBar value={trend.categoryFit} />
          <span className="text-xs text-gray-400 mt-0.5 block">
            {trend.categoryFit.toFixed(1)}/10
          </span>
        </div>
      </div>

      {/* Client fit tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {trend.clients.map((c) => (
          <span
            key={c.id}
            className="text-xs bg-rufus-purple/15 text-rufus-purple-light px-2 py-0.5 rounded-md"
          >
            {c.name}
          </span>
        ))}
        {trend.recommendedFormat && (
          <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-md ml-auto">
            {FORMAT_LABELS[trend.recommendedFormat]}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-rufus-border">
        <span className="text-[11px] text-gray-600">{timeSince}</span>
        <span className="text-[11px] text-rufus-purple-light opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Ver ficha <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  )
}

function getTimeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "Hace menos de 1h"
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}
