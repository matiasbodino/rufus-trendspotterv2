"use client"

import { useState, useMemo } from "react"
import { MOCK_TRENDS, MOCK_CLIENTS } from "@/lib/mock-data"
import { Platform, TrendStatus, Market, TrendCard as TrendCardType } from "@/lib/types"
import TrendFilters from "@/components/TrendFilters"
import TrendCardComponent from "@/components/TrendCard"
import TrendDetail from "@/components/TrendDetail"
import { TrendingUp, Zap, Clock, BarChart3 } from "lucide-react"

export default function DashboardPage() {
  const [trends, setTrends] = useState<TrendCardType[]>(MOCK_TRENDS)
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all")
  const [filterStatus, setFilterStatus] = useState<TrendStatus | "all">("all")
  const [filterMarket, setFilterMarket] = useState<Market | "all">("all")
  const [filterClient, setFilterClient] = useState<string | "all">("all")

  const filtered = useMemo(() => {
    return trends
      .filter((t) => filterPlatform === "all" || t.platform === filterPlatform)
      .filter((t) => filterStatus === "all" || t.status === filterStatus)
      .filter((t) => filterMarket === "all" || t.market === filterMarket)
      .filter(
        (t) =>
          filterClient === "all" ||
          t.clients.some((c) => c.id === filterClient)
      )
      .sort((a, b) => b.score - a.score)
  }, [trends, filterPlatform, filterStatus, filterMarket, filterClient])

  const activeTrend = trends.find((t) => t.id === selectedTrend) || null

  const handleStatusChange = (trendId: string, status: TrendStatus) => {
    setTrends((prev) =>
      prev.map((t) => (t.id === trendId ? { ...t, status } : t))
    )
  }

  // Stats
  const urgentCount = trends.filter((t) => t.activationWindow === "URGENTE" && t.status === "NEW").length
  const avgScore = trends.length > 0
    ? (trends.reduce((sum, t) => sum + t.score, 0) / trends.length).toFixed(1)
    : "0"
  const newCount = trends.filter((t) => t.status === "NEW").length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-rufus-purple" />
          Feed de Tendencias
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Tendencias detectadas en las últimas 24 horas — Argentina
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Zap className="w-4 h-4" />}
          label="Tendencias hoy"
          value={String(trends.length)}
          color="text-rufus-purple"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Urgentes"
          value={String(urgentCount)}
          color="text-red-400"
        />
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Score promedio"
          value={avgScore}
          color="text-yellow-400"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Nuevas sin revisar"
          value={String(newCount)}
          color="text-blue-400"
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TrendFilters
          selectedPlatform={filterPlatform}
          selectedStatus={filterStatus}
          selectedMarket={filterMarket}
          selectedClient={filterClient}
          onPlatformChange={setFilterPlatform}
          onStatusChange={setFilterStatus}
          onMarketChange={setFilterMarket}
          onClientChange={setFilterClient}
          clients={MOCK_CLIENTS}
        />
      </div>

      {/* Results count */}
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          {filtered.length} tendencia{filtered.length !== 1 ? "s" : ""}{" "}
          {filterPlatform !== "all" || filterStatus !== "all" || filterClient !== "all"
            ? "(filtradas)"
            : ""}
        </span>
      </div>

      {/* Trend grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((trend) => (
          <TrendCardComponent
            key={trend.id}
            trend={trend}
            onSelect={setSelectedTrend}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No se encontraron tendencias con los filtros seleccionados.
          </p>
        </div>
      )}

      {/* Detail panel */}
      {activeTrend && (
        <TrendDetail
          trend={activeTrend}
          onClose={() => setSelectedTrend(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-rufus-card border border-rufus-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-gray-500 uppercase">{label}</span>
      </div>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  )
}
