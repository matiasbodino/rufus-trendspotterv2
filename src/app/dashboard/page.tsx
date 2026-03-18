"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Platform, TrendStatus, Market, TrendCard as TrendCardType, Client } from "@/lib/types"
import TrendFilters from "@/components/TrendFilters"
import TrendCardComponent from "@/components/TrendCard"
import TrendDetail from "@/components/TrendDetail"
import { TrendingUp, Zap, Clock, BarChart3, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [trends, setTrends] = useState<TrendCardType[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all")
  const [filterStatus, setFilterStatus] = useState<TrendStatus | "all">("all")
  const [filterMarket, setFilterMarket] = useState<Market | "all">("all")
  const [filterClient, setFilterClient] = useState<string | "all">("all")

  const fetchTrends = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterPlatform !== "all") params.set("platform", filterPlatform)
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterMarket !== "all") params.set("market", filterMarket)
      if (filterClient !== "all") params.set("clientId", filterClient)

      const res = await fetch(`/api/trends?${params.toString()}`)
      const data = await res.json()
      setTrends(data.trends || [])
    } catch (err) {
      console.error("Failed to fetch trends:", err)
    } finally {
      setLoading(false)
    }
  }, [filterPlatform, filterStatus, filterMarket, filterClient])

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data.clients || [])
    } catch {
      setClients([])
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    setLoading(true)
    fetchTrends()
  }, [fetchTrends])

  const filtered = useMemo(() => {
    return [...trends].sort((a, b) => b.score - a.score)
  }, [trends])

  const activeTrend = trends.find((t) => t.id === selectedTrend) || null

  const handleStatusChange = async (trendId: string, status: TrendStatus) => {
    try {
      await fetch("/api/trends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trendId, status }),
      })
      setTrends((prev) =>
        prev.map((t) => (t.id === trendId ? { ...t, status } : t))
      )
    } catch (err) {
      console.error("Failed to update status:", err)
    }
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
          clients={clients}
        />
      </div>

      {/* Results count */}
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          {filtered.length} tendencia{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
          <span className="ml-2 text-gray-500">Cargando tendencias...</span>
        </div>
      )}

      {/* Trend grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((trend) => (
            <TrendCardComponent
              key={trend.id}
              trend={trend}
              onSelect={setSelectedTrend}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No se encontraron tendencias. Los cron jobs van a ir agregando tendencias automáticamente.
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
