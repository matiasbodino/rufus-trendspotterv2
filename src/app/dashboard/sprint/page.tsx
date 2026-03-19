"use client"

import { useState, useEffect, useCallback } from "react"
import { TrendCard as TrendCardType, Client, BriefFormat, FORMAT_LABELS } from "@/lib/types"
import { Zap, CheckCircle, Loader2, FileText, ChevronDown } from "lucide-react"

export default function SprintPage() {
  const [trends, setTrends] = useState<TrendCardType[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedTrends, setSelectedTrends] = useState<Set<string>>(new Set())
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<BriefFormat>("UGC")
  const [briefs, setBriefs] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/trends").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]).then(([trendsData, clientsData]) => {
      setTrends(trendsData.trends || [])
      setClients(clientsData.clients || [])
      setLoading(false)
    })
  }, [])

  const toggleTrend = (id: string) => {
    setSelectedTrends((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 5) next.add(id)
      return next
    })
  }

  const generateBrief = async (trendId: string) => {
    const trend = trends.find((t) => t.id === trendId)
    const client = clients.find((c) => c.id === selectedClient)
    if (!trend || !client) return

    setGenerating(trendId)
    try {
      const res = await fetch("/api/claude/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trendName: trend.name,
          trendDescription: trend.description,
          trendManifestation: trend.manifestation,
          trendWhyNow: trend.whyNow,
          clientName: client.name,
          clientCategory: client.category,
          format: selectedFormat,
        }),
      })
      const data = await res.json()
      setBriefs((prev) => ({ ...prev, [trendId]: data.brief }))
    } catch (err) {
      console.error("Failed to generate brief:", err)
    } finally {
      setGenerating(null)
    }
  }

  const generateAll = async () => {
    const ids = Array.from(selectedTrends)
    for (const trendId of ids) {
      await generateBrief(trendId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-rufus-purple" />
          Sprint Mode
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seleccioná hasta 5 tendencias, elegí un cliente y generá briefs para la sesión de ideación.
        </p>
      </div>

      {/* Config bar */}
      <div className="bg-rufus-card border border-rufus-border rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs text-gray-500 uppercase block mb-1">Cliente</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-rufus-purple"
          >
            <option value="">Seleccionar cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase block mb-1">Formato</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as BriefFormat)}
            className="bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-rufus-purple"
          >
            {(Object.keys(FORMAT_LABELS) as BriefFormat[]).map((f) => (
              <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          <label className="text-xs text-gray-500 uppercase block mb-1">&nbsp;</label>
          <button
            onClick={generateAll}
            disabled={selectedTrends.size === 0 || !selectedClient || generating !== null}
            className="bg-rufus-purple hover:bg-rufus-purple-dark disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generar {selectedTrends.size} brief{selectedTrends.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      {/* Selected count */}
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          {selectedTrends.size}/5 tendencias seleccionadas — {trends.length} disponibles
        </span>
      </div>

      {/* Trends grid */}
      <div className="space-y-3 mb-8">
        {trends
          .sort((a, b) => b.score - a.score)
          .map((trend) => {
            const isSelected = selectedTrends.has(trend.id)
            const hasBrief = briefs[trend.id]
            const isGenerating = generating === trend.id

            return (
              <div
                key={trend.id}
                onClick={() => toggleTrend(trend.id)}
                className={`bg-rufus-card border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4 ${
                  isSelected
                    ? "border-rufus-purple bg-rufus-purple/5"
                    : "border-rufus-border hover:border-rufus-border"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "border-rufus-purple bg-rufus-purple"
                      : "border-gray-600"
                  }`}
                >
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium text-sm truncate">{trend.name}</h3>
                    <span className={`text-xs font-bold ${
                      trend.score >= 8 ? "text-green-400" : trend.score >= 6 ? "text-yellow-400" : "text-gray-400"
                    }`}>
                      {trend.score.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{trend.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isGenerating && <Loader2 className="w-4 h-4 text-rufus-purple animate-spin" />}
                  {hasBrief && <span className="text-xs text-green-400">✅ Brief listo</span>}
                </div>
              </div>
            )
          })}
      </div>

      {/* Generated briefs */}
      {Object.keys(briefs).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Briefs generados</h2>
          {Object.entries(briefs).map(([trendId, brief]) => {
            const trend = trends.find((t) => t.id === trendId)
            return (
              <div
                key={trendId}
                className="bg-rufus-card border border-rufus-border rounded-xl p-5"
              >
                <h3 className="text-white font-semibold mb-3">
                  {trend?.name || "Tendencia"}
                </h3>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {brief}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(brief)}
                  className="mt-3 text-xs text-rufus-purple-light hover:text-rufus-purple transition-colors"
                >
                  📋 Copiar brief
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
