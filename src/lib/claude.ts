import Anthropic from "@anthropic-ai/sdk"

// Use lazy init to ensure .env is loaded first by Next.js
let _anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    // Read directly from .env, bypassing any overrides
    const fs = require("fs")
    const path = require("path")
    const envPath = path.resolve(process.cwd(), ".env")
    let apiKey = process.env.ANTHROPIC_API_KEY || ""

    try {
      const envContent = fs.readFileSync(envPath, "utf-8")
      const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m)
      if (match) {
        apiKey = match[1].trim()
      }
    } catch {}

    _anthropic = new Anthropic({ apiKey })
  }
  return _anthropic
}

// Use getter to ensure lazy initialization
const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getAnthropicClient() as any)[prop]
  },
})

const RUFUS_CLIENTS = `Clientes activos de Rufus Social:
- MercadoLibre (ecommerce)
- Danone (food & bev)
- Disney (entretenimiento)
- Rappi (delivery)
- Despegar (travel)
- PedidosYa (delivery)
- CCU (food & bev)
- NaranjaX (fintech)`

export interface QualifyResult {
  califica: boolean
  score: number
  growthSpeed: number
  culturalRelevance: number
  durability: "FLASH" | "DAYS" | "WEEKS"
  ventana: "URGENTE" | "NORMAL" | "PUEDE_ESPERAR"
  clientes_potenciales: string[]
  categoria: string
  razon: string
}

export interface TrendCardResult {
  name: string
  description: string
  manifestation: string
  examples: string
  whyNow: string
  creativeAngle: string
  tags: string[]
  recommendedFormat: "ESTATICA" | "UGC" | "AD" | "VIDEO_ANIMADO"
}

export async function qualifySignal(signal: {
  title: string
  description: string
  platform: string
  metrics: Record<string, unknown>
  market: string
}): Promise<QualifyResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `Eres el motor de detección de tendencias culturales de Rufus Social, una agencia de performance creativo en LATAM.

Tu trabajo es evaluar si una señal detectada en redes o búsquedas ES UNA TENDENCIA CULTURAL RELEVANTE para el mercado argentino/latinoamericano. NO filtrás por industria ni por cliente — eso lo decide el equipo creativo después.

Una tendencia califica si:
- Es un tema, formato, momento cultural, meme, conversación o fenómeno que la gente está buscando, compartiendo o hablando AHORA
- Tiene velocidad de crecimiento real (no es solo ruido)
- Un equipo creativo de una agencia podría hacer algo con esto (contenido, real-time, pieza reactiva)

Criterios de scoring:
1. Velocidad de crecimiento (1-10): ¿cuánto creció en las últimas 24/48hs?
2. Relevancia cultural (1-10): ¿qué tan relevante es para la conversación cultural del mercado? Deportes locales, cultura pop, memes, eventos, personas públicas, fenómenos sociales = alto. Noticias hiperlocales sin potencial creativo = bajo.
3. Ventana de activación: URGENTE (<48hs, es ahora o nunca) / NORMAL (<1 semana) / PUEDE_ESPERAR
4. Durabilidad: FLASH (24-48hs máximo, contenido reactivo rápido) / DAYS (3-7 días, se puede producir algo de calidad) / WEEKS (tendencia sostenida, vale la pena invertir en producción)

El score final = growthSpeed * 0.5 + culturalRelevance * 0.3 + ventanaScore * 0.2
Donde ventanaScore: URGENTE=10, NORMAL=6, PUEDE_ESPERAR=3

IMPORTANTE: Sé generoso con la calificación. Si algo está trending y tiene potencial creativo, califica = true. El umbral es score >= 4. Solo rechazá cosas que son puro ruido sin ningún ángulo creativo posible.

${RUFUS_CLIENTS}

Devuelve SOLO un JSON válido sin markdown, sin backticks, sin explicación adicional.`,
    messages: [
      {
        role: "user",
        content: `Evalúa esta señal detectada en ${signal.platform} (mercado: ${signal.market}):

Título: ${signal.title}
Descripción: ${signal.description}
Métricas: ${JSON.stringify(signal.metrics)}

Devuelve JSON con este formato exacto:
{"califica": boolean, "score": number, "growthSpeed": number, "culturalRelevance": number, "durability": "FLASH"|"DAYS"|"WEEKS", "ventana": "URGENTE"|"NORMAL"|"PUEDE_ESPERAR", "clientes_potenciales": ["NombreCliente1"], "categoria": "deportes|entretenimiento|cultura pop|gastronomia|tecnologia|humor|musica|politica|lifestyle|otro", "razon": "explicación breve de por qué es o no es tendencia relevante"}`,
      },
    ],
  })

  let text = response.content[0].type === "text" ? response.content[0].text : ""
  // Strip markdown backticks if Claude wraps the JSON
  text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()
  const result = JSON.parse(text)

  // Map to expected interface (backward compat)
  return {
    ...result,
    categoryFit: result.culturalRelevance || result.categoryFit || 5,
  } as QualifyResult
}

export async function generateTrendCard(signal: {
  title: string
  description: string
  platform: string
  metrics: Record<string, unknown>
  market: string
  qualification: QualifyResult
}): Promise<TrendCardResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Eres el Creative Strategist de Rufus Social. Tu trabajo es convertir señales de tendencia en fichas creativas que el equipo pueda escanear rápido y decidir si activar.

Tono: creativo, directo, accionable. No datos — insights. Escribí en español rioplatense pero profesional.

La ficha NO es un brief — es un resumen rápido de QUÉ está pasando, CÓMO se manifiesta, y POR QUÉ importa ahora. El equipo creativo decide después si lo activa y para qué cliente.`,
    messages: [
      {
        role: "user",
        content: `Generá la ficha de tendencia para esta señal:

Plataforma: ${signal.platform}
Mercado: ${signal.market}
Título original: ${signal.title}
Descripción: ${signal.description}
Métricas: ${JSON.stringify(signal.metrics)}
Score: ${signal.qualification.score}
Ventana: ${signal.qualification.ventana}
Categoría: ${(signal.qualification as any).categoria || "general"}

Devuelve SOLO un JSON válido sin markdown ni backticks con este formato:
{"name": "nombre creativo y descriptivo de la tendencia", "description": "qué es y por qué importa (2-3 oraciones)", "manifestation": "cómo se manifiesta: formato, conversación, memes, contenido (2-3 oraciones)", "examples": "ejemplos reales o referencias concretas de cómo se está usando", "whyNow": "por qué es relevante AHORA — contexto cultural del momento", "creativeAngle": "UNA SOLA LÍNEA con un ángulo creativo concreto de cómo una marca podría activar esto (ej: 'Rappi podría hacer un Reel reaccionando en formato duet')", "tags": ["3-5 tags emergentes descriptivos como nostalgia, meme-argento, real-time, cultura-tv, food-moment, etc"], "recommendedFormat": "ESTATICA"|"UGC"|"AD"|"VIDEO_ANIMADO"}`,
      },
    ],
  })

  let text = response.content[0].type === "text" ? response.content[0].text : ""
  text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()
  return JSON.parse(text) as TrendCardResult
}

export async function generateBrief(params: {
  trendName: string
  trendDescription: string
  trendManifestation: string
  trendWhyNow: string
  clientName: string
  clientCategory: string
  format: "ESTATICA" | "UGC" | "AD" | "VIDEO_ANIMADO"
}): Promise<string> {
  const formatInstructions: Record<string, string> = {
    ESTATICA: `Generá un brief de ESTÁTICA con:
- Concepto visual en una línea
- Referencia de estética (mood, paleta, composición)
- Copy principal (headline)
- Copy secundario (bajada)
- Call to action
- Formato y dimensiones recomendadas

IMPORTANTE: Al final del brief, agregá una sección "PROMPT PARA MOCKUP VISUAL" con un prompt detallado en inglés listo para usar en Midjourney/DALL-E que el diseñador pueda copiar y pegar para generar un mockup de referencia visual. El prompt debe describir la composición, estilo, colores, mood y elementos visuales de la pieza.`,
    UGC: `Generá un brief de UGC con:
- Perfil del creator ideal (edad, estilo, tono)
- Escenario y contexto
- Hook de apertura (primeros 3 segundos)
- Guión conversacional (estructura, no textual)
- Entregables esperados (duración, formato, cantidad de variantes)`,
    AD: `Generá un brief de AD con:
- Objetivo de campaña
- Mensaje central
- Estructura del ad (hook / desarrollo / CTA con tiempos)
- Variantes de copy (A/B)
- Formato recomendado por plataforma`,
    VIDEO_ANIMADO: `Generá un brief de VIDEO ANIMADO con:
- Concepto y narrativa
- Estructura de escenas (escena por escena)
- Texto en pantalla por escena
- Ritmo y duración estimada
- Audio / música sugerida`,
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `Eres el Creative Strategist de Rufus Social. Generás briefs creativos listos para producción.

Tono: profesional pero creativo. Cada sección debe ser concreta y accionable — el equipo de producción tiene que poder ejecutar sin preguntas.

Escribí en español. Usá el nombre del cliente en el brief.`,
    messages: [
      {
        role: "user",
        content: `Generá un brief creativo para:

TENDENCIA: ${params.trendName}
Descripción: ${params.trendDescription}
Manifestación: ${params.trendManifestation}
Por qué ahora: ${params.trendWhyNow}

CLIENTE: ${params.clientName} (${params.clientCategory})
FORMATO: ${params.format}

${formatInstructions[params.format]}

Devolvé el brief como texto plano formateado, listo para copiar y usar. No uses JSON, devolvé texto directo.`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  return text
}
