export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { userData, question } = await req.json();

  const fmt = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency", currency: "ARS", maximumFractionDigits: 0,
    }).format(n || 0);

  const PAY_LABELS  = { semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual" };
  const PAY_FACTORS = { semanal: 4.333, quincenal: 2.167, mensual: 1 };
  const freq        = userData.payFrequency || "mensual";
  const freqLabel   = PAY_LABELS[freq] || "Mensual";
  const income      = userData.monthlyIncome || Math.round((userData.income || 0) * (PAY_FACTORS[freq] || 1));

  const totalFixed    = (userData.fixedExpenses || []).reduce((s, e) => s + e.amount, 0);
  const totalDebtMo   = (userData.debts || []).reduce((s, d) => s + (+d.monthly || 0), 0);
  const totalRestante = (userData.debts || []).reduce((s, d) => s + (((d.cuotas||0)-(d.cuotasPagadas||0))*(+d.monthly||0)), 0);
  const surplus       = income - totalFixed - totalDebtMo;

  const systemPrompt = `Sos un asesor financiero personal experto, amigable y directo. Respondés en español argentino (tuteo). Sos conciso pero completo. Siempre basás tus consejos en los DATOS REALES del usuario que te doy abajo. Nunca des consejos genéricos — todo tiene que ser específico a su situación.

DATOS FINANCIEROS DEL USUARIO:
- Nombre: ${userData.name}
- Frecuencia de cobro: ${freqLabel}${freq !== "mensual" ? ` (cobra ${fmt(userData.income)} por período)` : ""}
- Ingreso mensual equivalente: ${fmt(income)}
- Total gastos fijos: ${fmt(totalFixed)} (${income > 0 ? ((totalFixed/income)*100).toFixed(0) : 0}% del ingreso)
- Total cuotas/deudas por mes: ${fmt(totalDebtMo)} (${income > 0 ? ((totalDebtMo/income)*100).toFixed(0) : 0}% del ingreso)
- Dinero disponible por mes: ${fmt(surplus)}
- Fondo de emergencia actual: ${fmt(userData.goals?.emBal || 0)} (meta: ${userData.goals?.emMonths || 6} meses de gastos)
- Saldo de inversiones: ${fmt(userData.goals?.invBal || 0)}
- % que quiere invertir: ${userData.goals?.invPct || 20}%

GASTOS FIJOS DETALLADOS:
${(userData.fixedExpenses || []).map(e => `- ${e.label}: ${fmt(e.amount)}`).join("\n") || "- Ninguno cargado"}

DEUDAS ACTIVAS:
${(userData.debts || []).map(d => `- ${d.name}: ${fmt(d.monthly)}/mes, ${(d.cuotas||0)-(d.cuotasPagadas||0)} cuotas restantes, total restante ${fmt(((d.cuotas||0)-(d.cuotasPagadas||0))*(+d.monthly||0))}`).join("\n") || "- Sin deudas (¡excelente!)"}

TOTAL RESTANTE EN DEUDAS: ${fmt(totalRestante)}

Respondé la pregunta del usuario de forma personalizada, usando sus números reales. Si hay algo urgente que mejorar, decilo. Limitá la respuesta a 3-5 párrafos claros. Usá emojis moderadamente.`;

  const body = {
    contents: [
      { role: "user", parts: [{ text: systemPrompt + "\n\nPREGUNTA DEL USUARIO: " + question }] }
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return new Response(JSON.stringify({ answer: "⚙️ Error: falta GEMINI_API_KEY en las variables de entorno de Vercel." }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Probamos distintos modelos y versiones de API en orden de preferencia
  const ATTEMPTS = [
    { api: "v1beta", model: "gemini-2.0-flash" },
    { api: "v1beta", model: "gemini-2.0-flash-exp" },
    { api: "v1",     model: "gemini-1.5-flash" },
    { api: "v1",     model: "gemini-1.5-flash-latest" },
    { api: "v1",     model: "gemini-1.5-pro" },
    { api: "v1beta", model: "gemini-1.5-flash-latest" },
    { api: "v1beta", model: "gemini-pro" },
  ];

  const errors = [];

  for (const { api, model } of ATTEMPTS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );

      const data = await res.json();

      if (!res.ok) {
        errors.push(`[${api}/${model}] ${res.status}: ${data?.error?.message?.slice(0, 80) || "?"}`);
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return new Response(JSON.stringify({ answer: text, _model: model }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "sin texto";
      errors.push(`[${api}/${model}] OK pero sin texto: ${reason}`);
    } catch (e) {
      errors.push(`[${api}/${model}] excepción: ${e.message}`);
    }
  }

  return new Response(JSON.stringify({
    answer: `❌ Ningún modelo Gemini respondió correctamente.\n\n${errors.join("\n")}\n\nVerificá que la API key en Vercel (Settings → Environment Variables → GEMINI_API_KEY) sea válida y tenga la Gemini API habilitada en Google AI Studio (aistudio.google.com).`
  }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
