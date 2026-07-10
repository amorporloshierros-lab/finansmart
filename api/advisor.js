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

  const totalFixed   = (userData.fixedExpenses || []).reduce((s, e) => s + e.amount, 0);
  const totalDebtMo  = (userData.debts || []).reduce((s, d) => s + (+d.monthly || 0), 0);
  const totalRestante = (userData.debts || []).reduce((s, d) => s + (((d.cuotas||0)-(d.cuotasPagadas||0))*(+d.monthly||0)), 0);
  const surplus      = income - totalFixed - totalDebtMo;

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
    return new Response(JSON.stringify({ answer: "⚙️ Error de configuración: falta la API key de Gemini en el servidor. Contactá al administrador." }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Intentamos primero con gemini-2.0-flash, fallback a gemini-1.5-flash
  const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = "";

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );

      const data = await res.json();

      if (!res.ok) {
        lastError = `[${model}] HTTP ${res.status}: ${data?.error?.message || JSON.stringify(data)}`;
        continue; // probar siguiente modelo
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return new Response(JSON.stringify({ answer: text }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // Candidato bloqueado por safety filter u otro motivo
      const blockReason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "desconocido";
      lastError = `[${model}] Sin texto. Motivo: ${blockReason}`;
    } catch (e) {
      lastError = `[${model}] Excepción: ${e.message}`;
    }
  }

  // Todos los modelos fallaron — devolvemos el error real para ayudar a diagnosticar
  return new Response(JSON.stringify({
    answer: `❌ No se pudo obtener respuesta del asesor IA.\n\nDetalle técnico: ${lastError}\n\nSi el problema persiste, verificá que la API key de Gemini esté activa en la configuración de Vercel.`
  }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
