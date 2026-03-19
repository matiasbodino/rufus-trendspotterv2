"use client"

import { useState, useEffect } from "react"
import { Building2, Plus, Save, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react"

interface ClientProfile {
  id?: string
  name: string
  category: string
  market: string
  slackChannelId: string
  audienceAge: string
  audienceInterests: string
  toneOfVoice: string
  brandTerritory: string
  prohibitedTopics: string
  contentExamples: string
  activePlatforms: string[]
  brandContext: string
}

const EMPTY_CLIENT: ClientProfile = {
  name: "", category: "", market: "ARG", slackChannelId: "",
  audienceAge: "", audienceInterests: "", toneOfVoice: "",
  brandTerritory: "", prohibitedTopics: "", contentExamples: "",
  activePlatforms: [], brandContext: "",
}

const PLATFORMS = ["TikTok", "Instagram", "Pinterest", "X", "YouTube", "LinkedIn"]
const CATEGORIES = ["Ecommerce", "Fintech", "Food & Bev", "Entretenimiento", "Travel", "Retail", "Tech", "Salud", "Moda", "Otro"]

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<ClientProfile>(EMPTY_CLIENT)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch("/api/clients", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing, ...form }),
        })
        const data = await res.json()
        setClients((prev) => prev.map((c) => (c.id === editing ? data.client : c)))
        setEditing(null)
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        setClients((prev) => [...prev, data.client])
        setCreating(false)
      }
      setForm(EMPTY_CLIENT)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (client: ClientProfile) => {
    setForm({ ...client })
    setEditing(client.id!)
    setCreating(false)
  }

  const startCreate = () => {
    setForm(EMPTY_CLIENT)
    setCreating(true)
    setEditing(null)
  }

  const cancel = () => {
    setForm(EMPTY_CLIENT)
    setCreating(false)
    setEditing(null)
  }

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      activePlatforms: f.activePlatforms.includes(p)
        ? f.activePlatforms.filter((x) => x !== p)
        : [...f.activePlatforms, p],
    }))
  }

  const isEditing = creating || editing

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-rufus-purple" />
            Brand Profiles
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Perfil de cada marca para que Claude sugiera fit con criterio
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={startCreate}
            className="bg-rufus-purple hover:bg-rufus-purple-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar cliente
          </button>
        )}
      </div>

      {/* Form */}
      {isEditing && (
        <div className="bg-rufus-card border border-rufus-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {creating ? "Nuevo cliente" : `Editando: ${form.name}`}
            </h2>
            <button onClick={cancel} className="text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 uppercase mb-1 block">Nombre de la marca *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple"
                placeholder="Ej: Rappi"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase mb-1 block">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple"
              >
                <option value="">Seleccionar...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase mb-1 block">Audiencia target (edad, intereses, NSE)</label>
            <input
              value={form.audienceAge}
              onChange={(e) => setForm({ ...form, audienceAge: e.target.value })}
              className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple"
              placeholder="Ej: 18-35, urbanos, nivel medio-alto, interesados en tecnología y delivery"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase mb-1 block">Tono de voz</label>
            <textarea
              value={form.toneOfVoice}
              onChange={(e) => setForm({ ...form, toneOfVoice: e.target.value })}
              rows={2}
              className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple resize-none"
              placeholder="Ej: Irreverente, cercano, con humor. Habla como un amigo, no como una marca. Usa lunfardo cuando aplica."
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase mb-1 block">Territorio de marca (de qué puede hablar)</label>
            <textarea
              value={form.brandTerritory}
              onChange={(e) => setForm({ ...form, brandTerritory: e.target.value })}
              rows={2}
              className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple resize-none"
              placeholder="Ej: Comida, delivery, cultura urbana, música, fútbol, momentos del día (almuerzo, cena, antojo)"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase mb-1 block">Temas prohibidos (de qué NO puede hablar)</label>
            <textarea
              value={form.prohibitedTopics}
              onChange={(e) => setForm({ ...form, prohibitedTopics: e.target.value })}
              rows={2}
              className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple resize-none"
              placeholder="Ej: Política, religión, violencia, competidores directos, temas sensibles de salud"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase mb-1 block">Ejemplos de contenido que funcionó</label>
            <textarea
              value={form.contentExamples}
              onChange={(e) => setForm({ ...form, contentExamples: e.target.value })}
              rows={2}
              className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple resize-none"
              placeholder="Ej: Reels con humor absurdo, UGC de creators reaccionando, memes de situaciones cotidianas"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase mb-1 block">Contexto adicional de la marca</label>
            <textarea
              value={form.brandContext}
              onChange={(e) => setForm({ ...form, brandContext: e.target.value })}
              rows={3}
              className="w-full bg-rufus-bg border border-rufus-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rufus-purple resize-none"
              placeholder="Cualquier info adicional que ayude a Claude a entender la marca. Estrategia actual, momento de la marca, objetivos, etc."
            />
          </div>

          <div className="mb-6">
            <label className="text-xs text-gray-500 uppercase mb-2 block">Plataformas activas</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.activePlatforms.includes(p)
                      ? "bg-rufus-purple/20 text-rufus-purple-light border border-rufus-purple/30"
                      : "bg-rufus-bg text-gray-500 border border-rufus-border hover:text-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={cancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name || saving}
              className="bg-rufus-purple hover:bg-rufus-purple-dark text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-rufus-purple animate-spin" />
        </div>
      ) : clients.length === 0 && !creating ? (
        <div className="text-center py-12 bg-rufus-card border border-rufus-border rounded-xl">
          <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">No hay clientes cargados todavía</p>
          <button
            onClick={startCreate}
            className="bg-rufus-purple hover:bg-rufus-purple-dark text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client: any) => (
            <div key={client.id} className="bg-rufus-card border border-rufus-border rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rufus-purple/20 flex items-center justify-center">
                    <span className="text-rufus-purple-light font-bold text-sm">
                      {client.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {client.category && (
                        <span className="text-xs text-gray-500">{client.category}</span>
                      )}
                      {client.toneOfVoice && (
                        <span className="text-xs text-green-500/70">● Perfil completo</span>
                      )}
                      {!client.toneOfVoice && (
                        <span className="text-xs text-yellow-500/70">○ Perfil incompleto</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {client.activePlatforms?.length > 0 && (
                    <div className="flex gap-1">
                      {client.activePlatforms.slice(0, 3).map((p: string) => (
                        <span key={p} className="text-[10px] bg-rufus-bg px-1.5 py-0.5 rounded text-gray-500">{p}</span>
                      ))}
                    </div>
                  )}
                  {expandedId === client.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedId === client.id && (
                <div className="px-5 pb-4 border-t border-rufus-border pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {client.audienceAge && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Audiencia</span>
                        <p className="text-gray-300 mt-1">{client.audienceAge}</p>
                      </div>
                    )}
                    {client.toneOfVoice && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Tono</span>
                        <p className="text-gray-300 mt-1">{client.toneOfVoice}</p>
                      </div>
                    )}
                    {client.brandTerritory && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Territorio</span>
                        <p className="text-gray-300 mt-1">{client.brandTerritory}</p>
                      </div>
                    )}
                    {client.prohibitedTopics && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Prohibido</span>
                        <p className="text-red-400/70 mt-1">{client.prohibitedTopics}</p>
                      </div>
                    )}
                  </div>
                  {client.brandContext && (
                    <div className="mt-3">
                      <span className="text-xs text-gray-500 uppercase">Contexto</span>
                      <p className="text-gray-300 mt-1 text-sm">{client.brandContext}</p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(client) }}
                      className="text-rufus-purple-light hover:text-rufus-purple text-sm font-medium transition-colors"
                    >
                      Editar perfil
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
