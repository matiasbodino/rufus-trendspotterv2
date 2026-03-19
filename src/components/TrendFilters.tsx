"use client"

import { Platform, TrendStatus, Market, PLATFORM_LABELS, STATUS_CONFIG } from "@/lib/types"

interface TrendFiltersProps {
  selectedPlatform: Platform | "all"
  selectedStatus: TrendStatus | "all"
  selectedMarket: Market | "all"
  onPlatformChange: (v: Platform | "all") => void
  onStatusChange: (v: TrendStatus | "all") => void
  onMarketChange: (v: Market | "all") => void
}

export default function TrendFilters({
  selectedPlatform,
  selectedStatus,
  selectedMarket,
  onPlatformChange,
  onStatusChange,
  onMarketChange,
}: TrendFiltersProps) {
  const selectClass =
    "bg-rufus-card border border-rufus-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-rufus-purple"

  return (
    <div className="flex flex-wrap gap-3">
      {/* Platform */}
      <select
        value={selectedPlatform}
        onChange={(e) => onPlatformChange(e.target.value as Platform | "all")}
        className={selectClass}
      >
        <option value="all">Todas las plataformas</option>
        {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
          <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as TrendStatus | "all")}
        className={selectClass}
      >
        <option value="all">Todos los estados</option>
        {(Object.keys(STATUS_CONFIG) as TrendStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
          </option>
        ))}
      </select>

      {/* Market */}
      <select
        value={selectedMarket}
        onChange={(e) => onMarketChange(e.target.value as Market | "all")}
        className={selectClass}
      >
        <option value="all">Todos los mercados</option>
        <option value="ARG">Argentina</option>
        <option value="MX">México</option>
      </select>
    </div>
  )
}
