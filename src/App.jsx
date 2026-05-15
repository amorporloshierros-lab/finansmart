import { useState, useMemo, useReducer, useRef, useEffect } from "react";
import { loginGoogle, loginEmail, registerEmail, logout, onAuth, saveUserData, loadUserData } from "./firebase";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg: "#0a0e1a", card: "#111827", card2: "#0f1623",
  border: "#1f2937", border2: "#374151",
  text: "#f1f5f9", muted: "#9ca3af", dim: "#6b7280",
  green: "#10b981", blue: "#3b82f6",
  amber: "#f59e0b", red: "#ef4444", purple: "#8b5cf6",
};

// tipo: "necesidad" = va al 50%, "ocio" = va al 30%
const DAILY_CATS = [
  { id: "comida",   label: "Comida / Restó",     icon: "🍔", color: "#f59e0b", tipo: "ocio"       },
  { id: "super",    label: "Supermercado",        icon: "🛒", color: "#10b981", tipo: "necesidad"  },
  { id: "transp",   label: "Transporte",          icon: "🚌", color: "#3b82f6", tipo: "necesidad"  },
  { id: "salud",    label: "Salud / Farmacia",    icon: "💊", color: "#ef4444", tipo: "necesidad"  },
  { id: "entret",   label: "Ocio / Entret.",      icon: "🎬", color: "#8b5cf6", tipo: "ocio"       },
  { id: "ropa",     label: "Ropa / Calzado",      icon: "👗", color: "#ec4899", tipo: "ocio"       },
  { id: "educ",     label: "Educación",           icon: "📚", color: "#14b8a6", tipo: "necesidad"  },
  { id: "hogar",    label: "Hogar / Arreglos",    icon: "🔧", color: "#6366f1", tipo: "necesidad"  },
  { id: "imprev",   label: "Imprevisto",          icon: "⚡", color: "#eab308", tipo: "necesidad"  },
  { id: "regalo",   label: "Regalo / Social",     icon: "🎁", color: "#f43f5e", tipo: "ocio"       },
  { id: "mascota",  label: "Mascota",             icon: "🐾", color: "#a78bfa", tipo: "necesidad"  },
  { id: "otros",    label: "Otros",               icon: "📦", color: "#64748b", tipo: "ocio"       },
];

const FIXED_TYPES = [
  // Vivienda
  { id: "alquiler",         label: "Alquiler / Hipoteca",        icon: "🏠", group: "Vivienda"   },
  { id: "expensas",         label: "Expensas",                   icon: "🏢", group: "Vivienda"   },
  // Servicios
  { id: "luz",              label: "Electricidad",               icon: "💡", group: "Servicios"  },
  { id: "gas",              label: "Gas",                        icon: "🔥", group: "Servicios"  },
  { id: "agua",             label: "Agua",                       icon: "💧", group: "Servicios"  },
  { id: "internet",         label: "Internet / Cable",           icon: "📡", group: "Servicios"  },
  { id: "celular",          label: "Celular / Plan",             icon: "📱", group: "Servicios"  },
  { id: "streaming",        label: "Streaming / Suscripciones",  icon: "📺", group: "Servicios"  },
  // Transporte — Auto
  { id: "combustible_auto", label: "Combustible (auto)",         icon: "⛽", group: "Transporte" },
  { id: "patente_vtv",      label: "Patente / VTV (auto)",       icon: "📋", group: "Transporte" },
  { id: "seg_auto",         label: "Seguro auto",                icon: "🚗", group: "Transporte" },
  // Transporte — Moto
  { id: "combustible_moto", label: "Combustible (moto)",         icon: "⛽", group: "Transporte" },
  { id: "patente_moto",     label: "Patente (moto)",             icon: "📋", group: "Transporte" },
  { id: "seg_moto",         label: "Seguro moto",                icon: "🏍️", group: "Transporte" },
  // Transporte — Bici / Público
  { id: "seg_bici",         label: "Seguro bici",                icon: "🚲", group: "Transporte" },
  { id: "transp_pub",       label: "Transporte público / SUBE",  icon: "🚌", group: "Transporte" },
  // Comida
  { id: "super_mens",       label: "Supermercado (estimado mes)", icon: "🛒", group: "Comida"     },
  { id: "almuerzo",         label: "Almuerzo en trabajo",        icon: "🍱", group: "Comida"     },
  { id: "delivery_mens",    label: "Delivery / apps de comida",  icon: "🛵", group: "Comida"     },
  // Seguros
  { id: "seg_vida",         label: "Seguro Vida / Salud",        icon: "❤️", group: "Seguros"    },
  // Personal
  { id: "gym",              label: "Gimnasio / Deporte",         icon: "🏋️", group: "Personal"   },
  // Mascotas
  { id: "mascota_comida",   label: "Comida / alimento mascota",  icon: "🐾", group: "Mascotas"   },
  { id: "mascota_vet",      label: "Veterinario / medicamentos", icon: "🏥", group: "Mascotas"   },
  { id: "mascota_otros",    label: "Accesorios / baño mascota",  icon: "🦴", group: "Mascotas"   },
  // Otros
  { id: "otros_fij",        label: "Otros fijos",                icon: "📦", group: "Otros"      },
];

const TIPS = [
  { icon: "🏺", from: "El Hombre Más Rico de Babilonia — George Clason", tip: "Paga primero a ti mismo: guardá el 10% de todo lo que ganás ANTES de gastar. Esta es la regla de oro de las finanzas personales. Si vivís solo con el 90%, te adaptás. Si esperás \"lo que sobre\", nunca habrá nada." },
  { icon: "📊", from: "Regla 50/30/20 — Elizabeth Warren", tip: "50% para necesidades (alquiler, comida, servicios), 30% para gustos y ocio, 20% para ahorro e inversión. Es el esquema más sencillo y efectivo para ordenar el dinero sin privarse de vivir." },
  { icon: "🏔️", from: "Total Money Makeover — Dave Ramsey", tip: "Método Bola de Nieve: listá todas tus deudas de menor a mayor. Pagá el mínimo en todas y volcá todo el excedente a la más pequeña. Al liquidarla, sumá ese pago a la siguiente. El impulso psicológico es real y poderoso." },
  { icon: "🧠", from: "Padre Rico, Padre Pobre — Robert Kiyosaki", tip: "Un activo te mete dinero en el bolsillo. Un pasivo te lo saca. El auto, la ropa cara, la TV nueva: pasivos. Una propiedad que alquilás, inversiones, un negocio: activos. Enfocate en construir activos." },
  { icon: "⚡", from: "Psicología del Dinero — Morgan Housel", tip: "El ahorro no requiere un ingreso alto, requiere controlar el ego. El dinero que gastás en mostrar status es dinero que no trabaja para vos. Cada peso no gastado es un peso que se multiplica en el tiempo." },
  { icon: "🔄", from: "I Will Teach You to Be Rich — Ramit Sethi", tip: "Automatizá tus ahorros el mismo día que cobrás. Si el dinero nunca llega a tu cuenta de gastos, no lo vas a gastar. La automatización elimina la necesidad de fuerza de voluntad." },
  { icon: "📈", from: "El Inversor Inteligente — Benjamin Graham", tip: "El tiempo en el mercado supera siempre al timing del mercado. Invertir poco y consistentemente durante 20 años genera más riqueza que intentar adivinar cuándo entrar. Empezá hoy, aunque sea con poco." },
  { icon: "🎯", from: "Tu Dinero o Tu Vida — Vicki Robin", tip: "Cada peso que gastás representa tiempo de tu vida que vendiste para ganarlo. Antes de una compra, preguntate: ¿cuántas horas tuve que trabajar para pagar esto? ¿Ese tiempo vale lo mismo que este objeto?" },
  { icon: "🛡️", from: "Principio universal de finanzas personales", tip: "Sin fondo de emergencia, cualquier imprevisto (accidente, despido, enfermedad) puede destruir años de progreso financiero. No es un objetivo de largo plazo: es el primer paso, el más urgente." },
  { icon: "💳", from: "Dave Ramsey — Total Money Makeover", tip: "Si pagás solo el mínimo de una tarjeta de crédito al 50% anual, una deuda de $100.000 puede convertirse en $300.000 en pocos años. La tarjeta de crédito es la ilusión de tener dinero que no tenés." },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n || 0);

const todayStr = () => new Date().toISOString().split("T")[0];
const monthStr = () => new Date().toISOString().slice(0, 7);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `finansmart-backup-${todayStr()}.json`;
  a.click();
}

function calcScore(user) {
  const totalFixed = user.fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalDebt  = user.debts.reduce((s, d) => s + (+d.monthly || 0), 0);
  const savingsRate = user.income > 0
    ? ((user.income - totalFixed - totalDebt) / user.income) * 100 : 0;
  const debtRatio  = user.income > 0 ? (totalDebt / user.income) * 100 : 0;
  const fixedRatio = user.income > 0 ? (totalFixed / user.income) * 100 : 0;
  const totalExp   = totalFixed + totalDebt;
  const emGoal     = totalExp * user.goals.emMonths;
  const emPct      = emGoal > 0 ? (user.goals.emBal / emGoal) * 100 : 0;

  let score = 30;
  if (savingsRate >= 30) score += 20;
  else if (savingsRate >= 20) score += 15;
  else if (savingsRate >= 10) score += 8;
  else if (savingsRate < 0) score -= 15;
  if (debtRatio === 0) score += 15;
  else if (debtRatio < 10) score += 10;
  else if (debtRatio < 20) score += 5;
  else if (debtRatio > 40) score -= 10;
  if (fixedRatio < 50) score += 10;
  else if (fixedRatio > 70) score -= 8;
  score += Math.min(Math.round(emPct * 0.1), 10);
  if (user.goals.invPct >= 15) score += 5;
  else if (user.goals.invPct >= 10) score += 3;
  return Math.min(100, Math.max(0, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE — REDUCER
// ─────────────────────────────────────────────────────────────────────────────

const mkUser = (name, income) => ({
  id: uid(), name, income: +income,
  fixedExpenses: [], debts: [], dailyExpenses: [],
  extraIncome: [],   // [{ id, amount, desc, date }]
  goals: { emMonths: 6, invPct: 20, emBal: 0, invBal: 0 },
  onboarded: false,
  createdAt: new Date().toLocaleDateString("es-AR"),
});

const INIT = { users: [], uid: null };

function reduce(state, act) {
  const upd = (fn) => ({
    ...state,
    users: state.users.map((u) => (u.id === state.uid ? fn(u) : u)),
  });
  switch (act.type) {
    case "CREATE":    return { ...state, users: [...state.users, mkUser(act.name, act.income)] };
    case "CREATE_FB": {
      const u = { ...mkUser(act.name, 0), id: act.uid };
      return { users: [u], uid: act.uid };
    }
    case "LOGIN":    return { ...state, uid: act.id };
    case "LOGOUT":   return { ...state, uid: null };
    case "DEL_USER": return { ...state, users: state.users.filter((u) => u.id !== act.id), uid: null };
    case "ONBOARD":  return upd((u) => ({ ...u, ...act.data, onboarded: true }));
    case "UPD":      return upd((u) => ({ ...u, ...act.data }));
    case "ADD_EXP":  return upd((u) => ({ ...u, dailyExpenses: [act.exp, ...u.dailyExpenses] }));
    case "DEL_EXP":  return upd((u) => ({ ...u, dailyExpenses: u.dailyExpenses.filter((e) => e.id !== act.id) }));
    case "ADD_INC":  return upd((u) => ({ ...u, extraIncome: [act.inc, ...(u.extraIncome || [])] }));
    case "DEL_INC":  return upd((u) => ({ ...u, extraIncome: (u.extraIncome || []).filter((i) => i.id !== act.id) }));
    case "IMPORT":   return act.data;
    default:         return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE STYLES
// ─────────────────────────────────────────────────────────────────────────────

const sx = {
  input:  { background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" },
  select: { background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" },
  card:   { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16, marginBottom: 12 },
  label:  { fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 5 },
  row:    { display: "flex", alignItems: "center", justifyContent: "space-between" },
  btn:    (color = "#10b981", outline = false) => outline
    ? { background: "transparent", border: `1.5px solid ${color}`, color, borderRadius: 12, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }
    : { background: color, color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  pill:   (c) => ({ display: "inline-flex", alignItems: "center", gap: 4, background: c + "22", color: c, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600 }),
  progBg: { background: "#1f2937", borderRadius: 999, overflow: "hidden" },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ProgBar({ pct, color, h = 8 }) {
  return (
    <div style={{ ...sx.progBg, height: h }}>
      <div style={{
        height: "100%", borderRadius: 999,
        width: `${Math.min(Math.max(pct || 0, 0), 100)}%`,
        background: color, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
      }} />
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: LOGIN
// ─────────────────────────────────────────────────────────────────────────────

function LoginScreen({ state, dispatch }) {
  const [view, setView]     = useState(state.users.length === 0 ? "create" : "list");
  const [name, setName]     = useState("");
  const [income, setIncome] = useState("");
  const fileRef             = useRef();

  const create = () => {
    if (!name.trim() || !income || +income <= 0) return;
    dispatch({ type: "CREATE", name: name.trim(), income });
    setName(""); setIncome("");
    setView("list");
  };

  const doImport = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { try { dispatch({ type: "IMPORT", data: JSON.parse(ev.target.result) }); } catch { alert("Archivo inválido"); } };
    r.readAsText(f);
  };

  const wrap = { fontFamily: "'Inter',-apple-system,sans-serif", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: C.text };

  return (
    <div style={wrap}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 60, marginBottom: 8 }}>💸</div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>FinanSmart</div>
        <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>Controlá tu dinero · Construí tu futuro</div>
      </div>

      <div style={{ width: "100%", maxWidth: 380 }}>
        {view === "list" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Seleccioná tu perfil</div>
            {state.users.map((u) => (
              <div key={u.id} onClick={() => dispatch({ type: "LOGIN", id: u.id })}
                style={{ ...sx.card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "border-color 0.2s" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#10b98133", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: C.green, flexShrink: 0 }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: C.dim }}>Ingreso: {fmt(u.income)} · Creado: {u.createdAt}</div>
                </div>
                <div style={{ color: C.dim, fontSize: 20 }}>›</div>
              </div>
            ))}

            <button style={{ ...sx.btn(C.green), width: "100%", justifyContent: "center", marginTop: 4 }} onClick={() => setView("create")}>
              + Crear nuevo perfil
            </button>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={{ ...sx.btn("#374151"), flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => fileRef.current.click()}>
                📂 Importar backup
              </button>
              {state.users.length > 0 && (
                <button style={{ ...sx.btn("#374151"), flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => exportJSON(state)}>
                  💾 Exportar datos
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={doImport} />
          </>
        )}

        {view === "create" && (
          <>
            <div style={sx.card}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Crear perfil</div>
              <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>Tus datos se guardan solo en este dispositivo.</div>

              <label style={sx.label}>Tu nombre</label>
              <input style={{ ...sx.input, marginBottom: 14 }} placeholder="Ej: Lucas" value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()} />

              <label style={sx.label}>Ingreso mensual neto ($)</label>
              <input style={sx.input} type="number" placeholder="Ej: 400000" value={income}
                onChange={(e) => setIncome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()} />
              <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Lo que te depositan o cobrás, ya descontados impuestos</div>
            </div>

            <button style={{ ...sx.btn(), width: "100%", justifyContent: "center" }} onClick={create}>
              Crear perfil →
            </button>
            {state.users.length > 0 && (
              <button style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", width: "100%", marginTop: 12, fontSize: 13 }} onClick={() => setView("list")}>
                ← Volver
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────

function OnboardingScreen({ user, dispatch }) {
  const [step, setStep]     = useState(0);
  const [fixed, setFixed]   = useState(() => FIXED_TYPES.reduce((a, t) => ({ ...a, [t.id]: "" }), {}));
  const [debts, setDebts]   = useState([]);
  const [newDebt, setNewDebt] = useState({ name: "", total: "", cuotas: "", cuotasPagadas: "0", monthly: "", rate: "" });
  const [goals, setGoals]   = useState({ emMonths: 6, invPct: 20, emBal: "0", invBal: "0" });

  const totalFixed = Object.values(fixed).reduce((s, v) => s + (+v || 0), 0);
  const STEPS = ["Gastos fijos", "Deudas", "Tus metas"];

  const addDebt = () => {
    if (!newDebt.name || !newDebt.total || !newDebt.cuotas) return;
    const cuotas = +newDebt.cuotas;
    const cuotasPagadas = +newDebt.cuotasPagadas || 0;
    const monthly = +newDebt.monthly || Math.round(+newDebt.total / cuotas);
    setDebts((p) => [...p, { id: uid(), name: newDebt.name, total: +newDebt.total, cuotas, cuotasPagadas, monthly, rate: +newDebt.rate || 0 }]);
    setNewDebt({ name: "", total: "", cuotas: "", cuotasPagadas: "0", monthly: "", rate: "" });
  };

  const finish = () => {
    const fixedExpenses = FIXED_TYPES.filter((t) => +fixed[t.id] > 0).map((t) => ({
      id: uid(), typeId: t.id, label: t.label, icon: t.icon, amount: +fixed[t.id], group: t.group,
    }));
    dispatch({ type: "ONBOARD", data: { fixedExpenses, debts, goals: { emMonths: goals.emMonths, invPct: goals.invPct, emBal: +goals.emBal || 0, invBal: +goals.invBal || 0 } } });
  };

  const wrap = { fontFamily: "'Inter',-apple-system,sans-serif", background: C.bg, minHeight: "100vh", color: C.text };

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ padding: "20px 20px 16px", background: "#0f1729", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: 12, color: C.green, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Hola {user.name} 👋</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Configuremos tus finanzas</div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 999, background: i <= step ? C.green : "#1f2937", transition: "background 0.4s" }} />
              <div style={{ fontSize: 10, color: i === step ? C.green : C.dim, marginTop: 4, fontWeight: 600 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 100px" }}>

        {/* STEP 0 — Gastos fijos */}
        {step === 0 && (
          <div>
            <div style={{ ...sx.card, background: "#0f1a2e", borderColor: "#1e3a5f", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>💡 ¿Por qué esto importa?</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                Tus gastos fijos son compromisos que existen pase lo que pase. Conocerlos exactamente es el primer paso para saber de cuánto dinero realmente disponés cada mes.
              </div>
            </div>
            {["Vivienda", "Servicios", "Transporte", "Comida", "Seguros", "Personal", "Otros"].map((grp) => {
              const items = FIXED_TYPES.filter((t) => t.group === grp);
              return (
                <div key={grp} style={sx.card}>
                  <SectionTitle>{grp}</SectionTitle>
                  {items.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{t.icon}</span>
                      <span style={{ fontSize: 13, color: C.muted, flex: 1 }}>{t.label}</span>
                      <input style={{ ...sx.input, width: 130, textAlign: "right" }} type="number" placeholder="$0"
                        value={fixed[t.id]} onChange={(e) => setFixed((p) => ({ ...p, [t.id]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              );
            })}
            <div style={{ ...sx.card, background: "#0f2027", borderColor: "#1e3a5f" }}>
              <div style={{ ...sx.row }}>
                <span style={{ color: C.muted }}>Total gastos fijos</span>
                <span style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalFixed)}</span>
              </div>
              <div style={{ ...sx.row, marginTop: 6 }}>
                <span style={{ fontSize: 12, color: C.dim }}>% del ingreso</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: user.income > 0 && totalFixed / user.income > 0.7 ? C.red : user.income > 0 && totalFixed / user.income > 0.5 ? C.amber : C.green }}>
                  {user.income > 0 ? ((totalFixed / user.income) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — Deudas */}
        {step === 1 && (
          <div>
            <div style={{ ...sx.card, background: "#0f1a2e", borderColor: "#1e3a5f", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>💡 Método Bola de Nieve (Dave Ramsey)</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                Listá todas tus deudas. La estrategia: pagá mínimos en todas y atacá la más chica primero. Al liquidarla, sumá ese pago a la siguiente. Si no tenés deudas, ¡saltá al paso siguiente!
              </div>
            </div>

            {debts.map((d) => {
              const restantes = (d.cuotas || 0) - (d.cuotasPagadas || 0);
              const pct = d.cuotas > 0 ? ((d.cuotasPagadas || 0) / d.cuotas) * 100 : 0;
              return (
                <div key={d.id} style={sx.card}>
                  <div style={{ ...sx.row, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>💳 {d.name}</div>
                      <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{fmt(d.monthly)}/mes{d.rate > 0 ? ` · ${d.rate}% anual` : ""}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: C.red, fontWeight: 700 }}>{fmt(d.total)}</div>
                      <button onClick={() => setDebts((p) => p.filter((x) => x.id !== d.id))}
                        style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 12 }}>✕ quitar</button>
                    </div>
                  </div>
                  <ProgBar pct={pct} color={pct >= 100 ? C.green : C.red} h={6} />
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>
                    {d.cuotasPagadas || 0} de {d.cuotas} cuotas pagadas · <span style={{ color: C.amber }}>Quedan {restantes}</span>
                  </div>
                </div>
              );
            })}

            <div style={sx.card}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>+ Agregar deuda en cuotas</div>
              <label style={sx.label}>Nombre de la deuda</label>
              <input style={{ ...sx.input, marginBottom: 10 }} placeholder="Ej: Tarjeta Visa, Préstamo banco, Electrodoméstico"
                value={newDebt.name} onChange={(e) => setNewDebt((p) => ({ ...p, name: e.target.value }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div><label style={sx.label}>Monto total ($)</label><input style={sx.input} type="number" placeholder="$" value={newDebt.total} onChange={(e) => setNewDebt((p) => ({ ...p, total: e.target.value }))} /></div>
                <div><label style={sx.label}>Cuotas totales</label><input style={sx.input} type="number" placeholder="Ej: 12" value={newDebt.cuotas} onChange={(e) => setNewDebt((p) => ({ ...p, cuotas: e.target.value }))} /></div>
                <div><label style={sx.label}>Cuotas ya pagadas</label><input style={sx.input} type="number" placeholder="0" value={newDebt.cuotasPagadas} onChange={(e) => setNewDebt((p) => ({ ...p, cuotasPagadas: e.target.value }))} /></div>
                <div>
                  <label style={sx.label}>Valor cuota/mes ($)</label>
                  <input style={sx.input} type="number" placeholder={newDebt.total && newDebt.cuotas ? `≈ ${Math.round(+newDebt.total / +newDebt.cuotas)}` : "$"}
                    value={newDebt.monthly} onChange={(e) => setNewDebt((p) => ({ ...p, monthly: e.target.value }))} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 10 }}>Si dejás vacío el valor cuota, se calcula como total ÷ cuotas (sin interés)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div><label style={sx.label}>Interés anual %</label><input style={sx.input} type="number" placeholder="0%" value={newDebt.rate} onChange={(e) => setNewDebt((p) => ({ ...p, rate: e.target.value }))} /></div>
              </div>
              <button style={{ ...sx.btn(C.red), width: "100%", justifyContent: "center" }} onClick={addDebt}>+ Agregar deuda</button>
            </div>

            {debts.length === 0 && (
              <div style={{ textAlign: "center", color: C.dim, fontSize: 13, padding: "10px 0" }}>
                Si no tenés deudas, ¡excelente! Tocá Continuar.
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Metas */}
        {step === 2 && (
          <div>
            <div style={{ ...sx.card, background: "#0f1a2e", borderColor: "#1e3a5f", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa" }}>💡 Pagá primero a vos mismo</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>
                Definí cuánto querés ahorrar e invertir cada mes. Estos montos se separan <strong style={{ color: C.text }}>antes</strong> de gastar en nada. Mínimo recomendado: 10% ahorro, 10% inversión.
              </div>
            </div>

            <div style={sx.card}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>🛡️ Fondo de Emergencia</div>
              <label style={sx.label}>Meses de cobertura (meta)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <input type="range" min="1" max="12" value={goals.emMonths}
                  onChange={(e) => setGoals((p) => ({ ...p, emMonths: +e.target.value }))}
                  style={{ flex: 1, accentColor: C.blue }} />
                <span style={{ fontWeight: 800, color: C.blue, fontSize: 22, minWidth: 40 }}>{goals.emMonths}m</span>
              </div>
              <div style={{ fontSize: 12, color: C.dim, marginBottom: 14 }}>Expertos recomiendan entre 3 y 6 meses de gastos</div>
              <label style={sx.label}>¿Ya tenés algo ahorrado? ($)</label>
              <input style={sx.input} type="number" placeholder="0" value={goals.emBal}
                onChange={(e) => setGoals((p) => ({ ...p, emBal: e.target.value }))} />
            </div>

            <div style={sx.card}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>📈 Inversiones mensuales</div>
              <label style={sx.label}>% del ingreso a invertir cada mes</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <input type="range" min="0" max="50" value={goals.invPct}
                  onChange={(e) => setGoals((p) => ({ ...p, invPct: +e.target.value }))}
                  style={{ flex: 1, accentColor: C.green }} />
                <span style={{ fontWeight: 800, color: C.green, fontSize: 22, minWidth: 40 }}>{goals.invPct}%</span>
              </div>
              <div style={{ fontSize: 12, color: C.dim, marginBottom: 14 }}>
                = {fmt(user.income * goals.invPct / 100)}/mes · Mínimo sugerido: 10–15%
              </div>
              <label style={sx.label}>¿Ya tenés inversiones? ($)</label>
              <input style={sx.input} type="number" placeholder="0" value={goals.invBal}
                onChange={(e) => setGoals((p) => ({ ...p, invBal: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d1117", borderTop: "1px solid #1f2937", padding: "12px 20px", display: "flex", gap: 8 }}>
        {step > 0 && (
          <button style={{ ...sx.btn("#374151") }} onClick={() => setStep((s) => s - 1)}>← Atrás</button>
        )}
        <button style={{ ...sx.btn(C.green), flex: 1, justifyContent: "center" }}
          onClick={() => step < STEPS.length - 1 ? setStep((s) => s + 1) : finish()}>
          {step < STEPS.length - 1 ? "Continuar →" : "🚀 ¡Empezar a gestionar mis finanzas!"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

function MainApp({ user, state, dispatch }) {
  const [tab, setTab]             = useState("inicio");
  const [showAddExp, setShowAddExp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editFixed, setEditFixed] = useState(false);
  const [editGoals, setEditGoals] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [tipIdx, setTipIdx]       = useState(0);
  const [emAdd, setEmAdd]         = useState("");
  const [invAdd, setInvAdd]       = useState("");
  const [showAddInc, setShowAddInc] = useState(false);
  const [newInc, setNewInc]       = useState({ amount: "", desc: "", date: todayStr() });
  const [incomeEdit, setIncomeEdit] = useState(user.income.toString());

  const [newExp, setNewExp] = useState({ cat: "comida", amount: "", desc: "", date: todayStr(), tipo: "ocio" });
  const [goalsEdit, setGoalsEdit] = useState({
    emMonths: user.goals.emMonths, invPct: user.goals.invPct,
    emBal: user.goals.emBal.toString(), invBal: user.goals.invBal.toString(),
  });
  const [fixedEdit, setFixedEdit] = useState(() =>
    FIXED_TYPES.reduce((acc, t) => {
      const ex = user.fixedExpenses.find((e) => e.typeId === t.id);
      return { ...acc, [t.id]: ex ? ex.amount.toString() : "" };
    }, {})
  );
  const [newDebt, setNewDebt] = useState({ name: "", total: "", cuotas: "", cuotasPagadas: "0", monthly: "", rate: "" });

  // ── Computed ──
  const totalFixed      = useMemo(() => user.fixedExpenses.reduce((s, e) => s + e.amount, 0), [user.fixedExpenses]);
  const totalDebtMo     = useMemo(() => user.debts.reduce((s, d) => s + (+d.monthly || 0), 0), [user.debts]);
  const thisMonthExp    = useMemo(() => { const m = monthStr(); return user.dailyExpenses.filter((e) => e.date.startsWith(m)); }, [user.dailyExpenses]);
  const thisMonthInc    = useMemo(() => { const m = monthStr(); return (user.extraIncome || []).filter((i) => i.date.startsWith(m)); }, [user.extraIncome]);
  const totalDaily      = useMemo(() => thisMonthExp.reduce((s, e) => s + e.amount, 0), [thisMonthExp]);
  const totalExtraInc   = useMemo(() => thisMonthInc.reduce((s, i) => s + i.amount, 0), [thisMonthInc]);
  // Para análisis 50/30/20 y score solo usamos el ingreso BASE (estable)
  // Los extras son variables y no deben inflar la salud financiera
  const effectiveIncome = user.income; // base estable
  const totalIncomeMes  = user.income + totalExtraInc; // total real del mes (para el "disponible")

  // Split daily expenses by tipo (necesidad vs ocio) for 50/30/20
  const dailyNecesidades = useMemo(() => thisMonthExp.filter((e) => e.tipo === "necesidad").reduce((s, e) => s + e.amount, 0), [thisMonthExp]);
  const dailyOcio        = useMemo(() => thisMonthExp.filter((e) => e.tipo !== "necesidad").reduce((s, e) => s + e.amount, 0), [thisMonthExp]);

  const totalSpent   = totalFixed + totalDebtMo + totalDaily;
  const remaining    = totalIncomeMes - totalSpent; // disponible real incluye extras
  const invMonthly   = effectiveIncome * user.goals.invPct / 100; // inversión sobre ingreso base
  const totalExp     = totalFixed + totalDebtMo;
  const emGoal       = totalExp * user.goals.emMonths;
  const emPct        = emGoal > 0 ? (user.goals.emBal / emGoal) * 100 : 0;
  const score        = useMemo(() => calcScore(user), [user]);

  const byCat = useMemo(() => {
    const g = {};
    thisMonthExp.forEach((e) => { g[e.cat] = (g[e.cat] || 0) + e.amount; });
    return Object.entries(g).map(([id, value]) => {
      const c = DAILY_CATS.find((c) => c.id === id) || { label: id, color: "#64748b", icon: "📦" };
      return { name: c.icon + " " + c.label, value, color: c.color };
    }).sort((a, b) => b.value - a.value);
  }, [thisMonthExp]);

  const scoreColor = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
  const scoreLabel = score >= 75 ? "Muy buena 🟢" : score >= 50 ? "Regular 🟡" : "Necesita atención 🔴";

  const addExpense = () => {
    if (!newExp.amount || +newExp.amount <= 0) return;
    const cat = DAILY_CATS.find((c) => c.id === newExp.cat) || { label: newExp.cat, icon: "📦", tipo: "ocio" };
    dispatch({ type: "ADD_EXP", exp: { id: uid(), cat: newExp.cat, label: newExp.desc || cat.label, amount: +newExp.amount, date: newExp.date || todayStr(), tipo: newExp.tipo || cat.tipo || "ocio" } });
    setNewExp((p) => ({ ...p, amount: "", desc: "" }));
    setShowAddExp(false);
  };

  const addIncome = () => {
    if (!newInc.amount || +newInc.amount <= 0) return;
    dispatch({ type: "ADD_INC", inc: { id: uid(), amount: +newInc.amount, desc: newInc.desc || "Ingreso extra", date: newInc.date || todayStr() } });
    setNewInc({ amount: "", desc: "", date: todayStr() });
    setShowAddInc(false);
  };

  const delIncome = (id) => dispatch({ type: "DEL_INC", id });

  const saveFixed = () => {
    const fixedExpenses = FIXED_TYPES.filter((t) => +fixedEdit[t.id] > 0).map((t) => ({
      id: uid(), typeId: t.id, label: t.label, icon: t.icon, amount: +fixedEdit[t.id], group: t.group,
    }));
    dispatch({ type: "UPD", data: { fixedExpenses } });
    setEditFixed(false);
  };

  const saveGoals = () => {
    dispatch({ type: "UPD", data: { goals: { emMonths: goalsEdit.emMonths, invPct: goalsEdit.invPct, emBal: +goalsEdit.emBal || 0, invBal: +goalsEdit.invBal || 0 } } });
    setEditGoals(false);
  };

  const addDebt = () => {
    if (!newDebt.name || !newDebt.total || !newDebt.cuotas) return;
    const cuotas = +newDebt.cuotas;
    const cuotasPagadas = +newDebt.cuotasPagadas || 0;
    const monthly = +newDebt.monthly || Math.round(+newDebt.total / cuotas);
    dispatch({ type: "UPD", data: { debts: [...user.debts, { id: uid(), name: newDebt.name, total: +newDebt.total, cuotas, cuotasPagadas, monthly, rate: +newDebt.rate || 0 }] } });
    setNewDebt({ name: "", total: "", cuotas: "", cuotasPagadas: "0", monthly: "", rate: "" });
  };

  const removeDebt = (id) => dispatch({ type: "UPD", data: { debts: user.debts.filter((d) => d.id !== id) } });

  const payInstallment = (id) => {
    const debt = user.debts.find((d) => d.id === id);
    if (!debt) return;
    const newPaid = (debt.cuotasPagadas || 0) + 1;
    if (newPaid >= debt.cuotas) {
      // Deuda saldada — la eliminamos
      dispatch({ type: "UPD", data: { debts: user.debts.filter((d) => d.id !== id) } });
    } else {
      dispatch({ type: "UPD", data: { debts: user.debts.map((d) => d.id === id ? { ...d, cuotasPagadas: newPaid } : d) } });
    }
  };

  const projection = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    name: `M${i + 1}`,
    emergencia:  Math.round(user.goals.emBal  + (user.income * 0.10) * (i + 1)),
    inversiones: Math.round(user.goals.invBal + invMonthly * (i + 1)),
  })), [user.goals.emBal, user.goals.invBal, user.income, invMonthly]);

  const TABS = [
    { id: "inicio",  label: "Inicio",  icon: "📊" },
    { id: "fijos",   label: "Fijos",   icon: "🏠" },
    { id: "diarios", label: "Gastos",  icon: "📝" },
    { id: "deudas",  label: "Deudas",  icon: "💳" },
    { id: "asesor",  label: "Asesor",  icon: "🤖" },
  ];

  // ── TAB: INICIO ────────────────────────────────────────────────────────────
  const tabInicio = () => (
    <div>
      {/* Score hero */}
      <div style={{ ...sx.card, background: "linear-gradient(135deg,#0f2027,#0d1f3c)", borderColor: "#1e3a5f" }}>
        <div style={{ ...sx.row }}>
          <div>
            <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Salud financiera</div>
            <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, marginTop: 4, color: scoreColor }}>{score}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{scoreLabel}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.dim }}>Ingreso del mes</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(effectiveIncome)}</div>
            {totalExtraInc > 0 && (
              <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>
                Base {fmt(user.income)} + Extra {fmt(totalExtraInc)}
              </div>
            )}
            <div style={{ fontSize: 12, color: remaining >= 0 ? C.green : C.red, marginTop: 4, fontWeight: 700 }}>
              {remaining >= 0 ? `Libre: ${fmt(remaining)}` : `⚠️ Excedido ${fmt(Math.abs(remaining))}`}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <ProgBar pct={(totalSpent / effectiveIncome) * 100} color={remaining < 0 ? C.red : remaining < effectiveIncome * 0.1 ? C.amber : C.green} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.dim, marginTop: 5 }}>
            <span>Comprometido: {fmt(totalSpent)}</span>
            <span>{effectiveIncome > 0 ? ((totalSpent / effectiveIncome) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
      </div>

      {/* Ingresos extra del mes */}
      <div style={sx.card}>
        <div style={{ ...sx.row, marginBottom: showAddInc ? 12 : 0 }}>
          <div>
            <div style={{ fontWeight: 700 }}>💰 Ingresos extra del mes <span style={{ fontSize: 10, background: "#78350f", color: "#fbbf24", borderRadius: 6, padding: "2px 7px", fontWeight: 600, marginLeft: 4 }}>VARIABLE</span></div>
            {thisMonthInc.length > 0 && <div style={{ fontSize: 12, color: C.green, marginTop: 2 }}>{thisMonthInc.length} ingreso(s) · +{fmt(totalExtraInc)} · no cuenta en el análisis base</div>}
            {thisMonthInc.length === 0 && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Negocios, freelance, ventas… No se usan en el análisis 50/30/20</div>}
          </div>
          <button style={{ ...sx.btn(C.green), padding: "8px 14px", fontSize: 13 }} onClick={() => setShowAddInc(!showAddInc)}>+ Cargar</button>
        </div>

        {showAddInc && (
          <div style={{ borderTop: "1px solid #1f2937", paddingTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={sx.label}>Monto ($)</label>
                <input style={sx.input} type="number" placeholder="Ej: 50000" autoFocus
                  value={newInc.amount} onChange={(e) => setNewInc((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label style={sx.label}>Fecha</label>
                <input style={sx.input} type="date" value={newInc.date} onChange={(e) => setNewInc((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <label style={sx.label}>Descripción</label>
            <input style={{ ...sx.input, marginBottom: 10 }} placeholder="Ej: Venta moto, Trabajo freelance, Negocio X"
              value={newInc.desc} onChange={(e) => setNewInc((p) => ({ ...p, desc: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addIncome()} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...sx.btn(C.green), flex: 1, justifyContent: "center" }} onClick={addIncome}>Guardar ingreso</button>
              <button style={sx.btn("#374151")} onClick={() => setShowAddInc(false)}>✕</button>
            </div>
          </div>
        )}

        {thisMonthInc.map((inc) => (
          <div key={inc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid #1f2937", marginTop: 8 }}>
            <div style={{ fontSize: 20 }}>💵</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{inc.desc}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{inc.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>+{fmt(inc.amount)}</div>
              <button onClick={() => delIncome(inc.id)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 13 }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* 4 métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {[
          { label: "Gastos fijos", val: totalFixed, sub: `${user.fixedExpenses.length} ítems`, color: C.purple, icon: "🏠" },
          { label: "Deudas / mes", val: totalDebtMo, sub: `${user.debts.length} deuda(s)`, color: C.red, icon: "💳" },
          { label: "Gastos variables", val: totalDaily, sub: "este mes", color: C.amber, icon: "🛒" },
          { label: "Para invertir", val: invMonthly, sub: `${user.goals.invPct}% del ingreso`, color: C.green, icon: "📈" },
        ].map((m) => (
          <div key={m.label} style={{ ...sx.card, marginBottom: 0 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icon}</div>
            <div style={{ fontSize: 10, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{fmt(m.val)}</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Regla 50/30/20 */}
      <div style={sx.card}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Regla 50 / 30 / 20 — tu situación real</div>
        <div style={{ fontSize: 11, color: C.dim, marginBottom: 12 }}>Basado en ingreso fijo {fmt(user.income)}/mes · los ingresos variables no se incluyen</div>
        {[
          { label: "Necesidades (ideal 50%)", val: totalFixed + totalDebtMo + dailyNecesidades, ideal: 0.5, color: C.blue, sub: "Fijos + deudas + necesidades diarias" },
          { label: "Ocio / gustos (ideal 30%)", val: dailyOcio, ideal: 0.3, color: C.amber, sub: "Gastos etiquetados como 'gusto'" },
          { label: "Ahorro / inversión (ideal 20%)", val: invMonthly, ideal: 0.2, color: C.green, sub: `${user.goals.invPct}% del ingreso` },
        ].map((item) => {
          const actual = effectiveIncome > 0 ? (item.val / effectiveIncome) * 100 : 0;
          const idealPct = item.ideal * 100;
          const diff = actual - idealPct;
          return (
            <div key={item.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: C.muted }}>{item.label}</span>
                <span style={{ color: Math.abs(diff) < 10 ? item.color : C.amber, fontWeight: 700 }}>{actual.toFixed(0)}%</span>
              </div>
              <div style={{ position: "relative", height: 8 }}>
                <div style={{ ...sx.progBg, position: "absolute", inset: 0, height: 8 }}>
                  <div style={{ height: "100%", borderRadius: 999, width: `${Math.min(actual, 100)}%`, background: item.color }} />
                </div>
                <div style={{ position: "absolute", top: -3, bottom: -3, width: 2, background: "rgba(255,255,255,0.35)", borderRadius: 1, left: `${idealPct}%` }} />
              </div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>
                {fmt(item.val)} · ideal {fmt(effectiveIncome * item.ideal)} · {item.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráfico torta */}
      {byCat.length > 0 && (
        <div style={sx.card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Gastos variables este mes</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byCat} cx="50%" cy="50%" innerRadius={38} outerRadius={68} paddingAngle={3} dataKey="value">
                {byCat.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: C.text, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {byCat.map((c, i) => (
              <span key={i} style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Últimos movimientos */}
      {user.dailyExpenses.length > 0 && (
        <div style={sx.card}>
          <div style={{ ...sx.row, marginBottom: 10 }}>
            <span style={{ fontWeight: 700 }}>Últimos movimientos</span>
            <button style={{ background: "none", border: "none", color: C.green, cursor: "pointer", fontSize: 13 }} onClick={() => setTab("diarios")}>Ver todos →</button>
          </div>
          {user.dailyExpenses.slice(0, 5).map((e, i) => {
            const cat = DAILY_CATS.find((c) => c.id === e.cat) || { icon: "📦" };
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid #1f2937" : "none" }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{e.label}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{e.date}</div>
                </div>
                <div style={{ color: C.red, fontWeight: 700, fontSize: 14 }}>−{fmt(e.amount)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── TAB: FIJOS ─────────────────────────────────────────────────────────────
  const tabFijos = () => (
    <div>
      <div style={{ ...sx.row, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Gastos fijos</div>
          <div style={{ fontSize: 12, color: C.dim }}>Total: {fmt(totalFixed)} · {user.income > 0 ? ((totalFixed / user.income) * 100).toFixed(0) : 0}% del ingreso</div>
        </div>
        <button style={sx.btn()} onClick={() => {
          setFixedEdit(FIXED_TYPES.reduce((acc, t) => { const ex = user.fixedExpenses.find((e) => e.typeId === t.id); return { ...acc, [t.id]: ex ? ex.amount.toString() : "" }; }, {}));
          setEditFixed(true);
        }}>✏️ Editar</button>
      </div>

      {!editFixed ? (
        <>
          {user.fixedExpenses.length === 0 && (
            <div style={{ ...sx.card, textAlign: "center", padding: 40, color: C.muted }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div>No tenés gastos fijos cargados</div>
              <button style={{ ...sx.btn(), margin: "12px auto 0", display: "flex" }} onClick={() => setEditFixed(true)}>Agregar</button>
            </div>
          )}
          {["Vivienda", "Servicios", "Transporte", "Comida", "Seguros", "Personal", "Otros"].map((grp) => {
            const items = user.fixedExpenses.filter((e) => e.group === grp);
            if (!items.length) return null;
            return (
              <div key={grp} style={sx.card}>
                <SectionTitle>{grp}</SectionTitle>
                {items.map((e) => (
                  <div key={e.id} style={{ ...sx.row, padding: "8px 0", borderBottom: "1px solid #1f2937" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{e.icon}</span>
                      <span style={{ fontSize: 13, color: C.muted }}>{e.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Link to Deudas tab */}
          <div style={{ ...sx.card, background: "#1a0f0f", borderColor: "#7f1d1d", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#ef4444" }}>💳 Deudas en cuotas</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {user.debts.length > 0 ? `${user.debts.length} deuda(s) · ${fmt(totalDebtMo)}/mes` : "Sin deudas registradas"}
                </div>
              </div>
              <button style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }} onClick={() => setTab("deudas")}>Ver →</button>
            </div>
          </div>
        </>
      ) : (
        <div>
          {["Vivienda", "Servicios", "Transporte", "Comida", "Seguros", "Personal", "Otros"].map((grp) => (
            <div key={grp} style={sx.card}>
              <SectionTitle>{grp}</SectionTitle>
              {FIXED_TYPES.filter((t) => t.group === grp).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18, width: 26 }}>{t.icon}</span>
                  <span style={{ fontSize: 13, color: C.muted, flex: 1 }}>{t.label}</span>
                  <input style={{ ...sx.input, width: 130, textAlign: "right" }} type="number" placeholder="$0"
                    value={fixedEdit[t.id]} onChange={(e) => setFixedEdit((p) => ({ ...p, [t.id]: e.target.value }))} />
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...sx.btn(), flex: 1, justifyContent: "center" }} onClick={saveFixed}>Guardar cambios</button>
            <button style={sx.btn("#374151")} onClick={() => setEditFixed(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── TAB: DEUDAS ────────────────────────────────────────────────────────────
  const tabDeudas = () => {
    const snowball = [...user.debts].sort((a, b) => {
      const remA = ((a.cuotas || 0) - (a.cuotasPagadas || 0)) * (+a.monthly || 0);
      const remB = ((b.cuotas || 0) - (b.cuotasPagadas || 0)) * (+b.monthly || 0);
      return remA - remB;
    });
    const totalMensual  = user.debts.reduce((s, d) => s + (+d.monthly || 0), 0);
    const totalRestante = user.debts.reduce((s, d) => s + (((d.cuotas||0) - (d.cuotasPagadas||0)) * (+d.monthly||0)), 0);
    const totalOriginal = user.debts.reduce((s, d) => s + (+d.total || 0), 0);

    return (
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>💳 Mis deudas</div>

        {user.debts.length === 0 && (
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 32, textAlign: "center", color: "#9ca3af", marginBottom: 12 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9", marginBottom: 4 }}>¡Sin deudas!</div>
            <div style={{ fontSize: 13 }}>Eso es un logro financiero enorme. Usá ese dinero para construir riqueza.</div>
          </div>
        )}

        {user.debts.length > 0 && (
          <>
            {/* Resumen */}
            <div style={{ background: "#1a0f0f", border: "1px solid #7f1d1d", borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: "#ef4444", marginBottom: 10, fontSize: 13 }}>📊 Resumen total</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>DEUDA TOTAL</div>
                  <div style={{ fontWeight: 700, color: "#ef4444" }}>{fmt(totalOriginal)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>CUOTA/MES</div>
                  <div style={{ fontWeight: 700, color: "#f59e0b" }}>{fmt(totalMensual)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>RESTANTE</div>
                  <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{fmt(totalRestante)}</div>
                </div>
              </div>
            </div>

            {/* Plan Bola de Nieve */}
            <div style={{ background: "#0f1a2e", border: "1px solid #1e3a5f", borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: 6, fontSize: 14 }}>❄️ Plan Bola de Nieve</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12, lineHeight: 1.6 }}>
                Pagá el mínimo en todas y volcá todo el dinero extra a la más pequeña. Al liquidarla, sumá esa cuota a la siguiente. El impulso te lleva a liquidarlas todas más rápido.
              </div>
              {snowball.map((d, i) => {
                const restantes = (d.cuotas || 0) - (d.cuotasPagadas || 0);
                const rem = restantes * (+d.monthly || 0);
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < snowball.length - 1 ? "1px solid #1f2937" : "none" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? "#ef4444" : "#374151", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {i === 0 ? "🎯" : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? "#f1f5f9" : "#9ca3af" }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{restantes} cuotas · {fmt(d.monthly)}/mes</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: i === 0 ? "#ef4444" : "#6b7280", fontSize: 13 }}>{fmt(rem)}</div>
                      {i === 0 && <div style={{ fontSize: 10, color: "#ef4444" }}>¡Atacar primero!</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lista de deudas */}
            <div style={{ fontWeight: 700, fontSize: 14, margin: "16px 0 10px" }}>Detalle por deuda</div>
            {user.debts.map((d) => {
              const pagadas   = d.cuotasPagadas || 0;
              const restantes = (d.cuotas || 0) - pagadas;
              const pct       = d.cuotas > 0 ? (pagadas / d.cuotas) * 100 : 0;
              return (
                <div key={d.id} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>💳 {d.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{fmt(d.monthly)}/mes{d.rate > 0 ? ` · ${d.rate}% anual` : ""}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#ef4444", fontWeight: 700 }}>{fmt(d.total)}</div>
                      <button onClick={() => dispatch({ type: "UPD", data: { debts: user.debts.filter(x => x.id !== d.id) } })}
                        style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 12 }}>✕ quitar</button>
                    </div>
                  </div>
                  <div style={{ background: "#1f2937", borderRadius: 999, overflow: "hidden", height: 8 }}>
                    <div style={{ height: "100%", borderRadius: 999, width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? "#10b981" : "linear-gradient(90deg,#ef4444,#f59e0b)", transition: "width 0.6s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{pagadas} de {d.cuotas} cuotas pagadas</span>
                    <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>Quedan {restantes} · {fmt(restantes * (+d.monthly||0))}</span>
                  </div>
                  <button
                    style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 12, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onClick={() => {
                      const newPaid = pagadas + 1;
                      if (newPaid >= d.cuotas) {
                        dispatch({ type: "UPD", data: { debts: user.debts.filter(x => x.id !== d.id) } });
                      } else {
                        dispatch({ type: "UPD", data: { debts: user.debts.map(x => x.id === d.id ? { ...x, cuotasPagadas: newPaid } : x) } });
                      }
                    }}
                  >✓ Registrar cuota pagada ({pagadas + 1}/{d.cuotas})</button>
                </div>
              );
            })}
          </>
        )}

        {/* Agregar deuda */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16, marginTop: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>+ Agregar deuda en cuotas</div>
          <input style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            placeholder="Ej: Tarjeta Visa, Préstamo, Muebles 12 cuotas"
            value={newDebt.name} onChange={(e) => setNewDebt((p) => ({ ...p, name: e.target.value }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 5 }}>Monto total ($)</label>
              <input style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" }} type="number" placeholder="$" value={newDebt.total} onChange={(e) => setNewDebt((p) => ({ ...p, total: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 5 }}>Cuotas totales</label>
              <input style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" }} type="number" placeholder="Ej: 12" value={newDebt.cuotas} onChange={(e) => setNewDebt((p) => ({ ...p, cuotas: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 5 }}>Cuotas ya pagadas</label>
              <input style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" }} type="number" placeholder="0" value={newDebt.cuotasPagadas} onChange={(e) => setNewDebt((p) => ({ ...p, cuotasPagadas: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6b7280", display: "block", marginBottom: 5 }}>Cuota/mes ($)</label>
              <input style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "11px 14px", color: "#f1f5f9", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" }} type="number"
                placeholder={newDebt.total && newDebt.cuotas ? `≈ ${Math.round(+newDebt.total / +newDebt.cuotas)}` : "$"}
                value={newDebt.monthly} onChange={(e) => setNewDebt((p) => ({ ...p, monthly: e.target.value }))} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>Si no sabés la cuota exacta, se calcula como total ÷ cuotas</div>
          <button style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            onClick={() => {
              if (!newDebt.name || !newDebt.total || !newDebt.cuotas) return;
              const cuotas = +newDebt.cuotas;
              const cuotasPagadas = +newDebt.cuotasPagadas || 0;
              const monthly = +newDebt.monthly || Math.round(+newDebt.total / cuotas);
              dispatch({ type: "UPD", data: { debts: [...user.debts, { id: Math.random().toString(36).slice(2) + Date.now().toString(36), name: newDebt.name, total: +newDebt.total, cuotas, cuotasPagadas, monthly, rate: +newDebt.rate || 0 }] } });
              setNewDebt({ name: "", total: "", cuotas: "", cuotasPagadas: "0", monthly: "", rate: "" });
            }}>Agregar deuda</button>
        </div>
      </div>
    );
  };

  // ── TAB: DIARIOS ───────────────────────────────────────────────────────────
  const tabDiarios = () => (
    <div>
      <div style={{ ...sx.row, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Gastos del día</div>
          <div style={{ fontSize: 12, color: C.dim }}>{thisMonthExp.length} registros · {fmt(totalDaily)} este mes</div>
        </div>
        <button style={sx.btn()} onClick={() => setShowAddExp(!showAddExp)}>+ Agregar</button>
      </div>

      {showAddExp && (
        <div style={{ ...sx.card, borderColor: C.green, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: C.green, marginBottom: 12 }}>✏️ Nuevo gasto</div>
          <label style={sx.label}>Categoría</label>
          <select style={{ ...sx.select, marginBottom: 10 }} value={newExp.cat}
            onChange={(e) => {
              const cat = DAILY_CATS.find((c) => c.id === e.target.value);
              setNewExp((p) => ({ ...p, cat: e.target.value, tipo: cat?.tipo || "ocio" }));
            }}>
            {DAILY_CATS.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>

          {/* Etiqueta tipo */}
          <label style={{ ...sx.label, marginBottom: 8 }}>¿Es una necesidad o un gusto?</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[
              { val: "necesidad", label: "🏠 Necesidad", desc: "Va al 50% (alquiler, comida, salud…)", color: C.blue },
              { val: "ocio",      label: "🎬 Gusto",     desc: "Va al 30% (restó, ropa, entret…)",   color: C.amber },
            ].map((opt) => (
              <button key={opt.val} onClick={() => setNewExp((p) => ({ ...p, tipo: opt.val }))}
                style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: `2px solid ${newExp.tipo === opt.val ? opt.color : "#374151"}`, background: newExp.tipo === opt.val ? opt.color + "22" : "transparent", color: newExp.tipo === opt.val ? opt.color : C.muted, cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                {opt.label}
                <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2, color: newExp.tipo === opt.val ? opt.color : C.dim }}>{opt.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <label style={sx.label}>Monto ($)</label>
              <input style={sx.input} type="number" placeholder="0" value={newExp.amount}
                onChange={(e) => setNewExp((p) => ({ ...p, amount: e.target.value }))} autoFocus />
            </div>
            <div>
              <label style={sx.label}>Fecha</label>
              <input style={sx.input} type="date" value={newExp.date}
                onChange={(e) => setNewExp((p) => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <label style={sx.label}>Descripción (opcional)</label>
          <input style={{ ...sx.input, marginBottom: 12 }} placeholder="Ej: Almuerzo en el trabajo"
            value={newExp.desc} onChange={(e) => setNewExp((p) => ({ ...p, desc: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addExpense()} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...sx.btn(), flex: 1, justifyContent: "center" }} onClick={addExpense}>Guardar gasto</button>
            <button style={sx.btn("#374151")} onClick={() => setShowAddExp(false)}>✕</button>
          </div>
        </div>
      )}

      {user.dailyExpenses.length === 0 && (
        <div style={{ ...sx.card, textAlign: "center", padding: 40, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          <div>Todavía no registraste gastos</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Tocá "+ Agregar" para empezar a registrar</div>
        </div>
      )}

      {user.dailyExpenses.map((e) => {
        const cat = DAILY_CATS.find((c) => c.id === e.cat) || { icon: "📦", color: "#64748b" };
        return (
          <div key={e.id} style={{ ...sx.card, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{cat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.label}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
                {cat.label} · {e.date}
                <span style={{ ...sx.pill(e.tipo === "necesidad" ? C.blue : C.amber), fontSize: 10, padding: "1px 6px" }}>
                  {e.tipo === "necesidad" ? "Necesidad" : "Gusto"}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: C.red, fontWeight: 700, fontSize: 14 }}>−{fmt(e.amount)}</div>
              <button onClick={() => dispatch({ type: "DEL_EXP", id: e.id })}
                style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 13 }}>🗑</button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── TAB: METAS ─────────────────────────────────────────────────────────────
  const tabMetas = () => (
    <div>
      <div style={{ ...sx.row, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Mis metas</div>
        {!editGoals && (
          <button style={sx.btn()} onClick={() => { setGoalsEdit({ emMonths: user.goals.emMonths, invPct: user.goals.invPct, emBal: user.goals.emBal.toString(), invBal: user.goals.invBal.toString() }); setEditGoals(true); }}>✏️ Editar</button>
        )}
      </div>

      {editGoals && (
        <div style={{ ...sx.card, borderColor: C.green, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: C.green, marginBottom: 14 }}>✏️ Editar metas</div>
          <label style={sx.label}>Meses fondo emergencia</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <input type="range" min="1" max="12" value={goalsEdit.emMonths} onChange={(e) => setGoalsEdit((p) => ({ ...p, emMonths: +e.target.value }))} style={{ flex: 1, accentColor: C.blue }} />
            <span style={{ color: C.blue, fontWeight: 800, minWidth: 36, fontSize: 20 }}>{goalsEdit.emMonths}m</span>
          </div>
          <label style={sx.label}>% del ingreso a invertir</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <input type="range" min="0" max="50" value={goalsEdit.invPct} onChange={(e) => setGoalsEdit((p) => ({ ...p, invPct: +e.target.value }))} style={{ flex: 1, accentColor: C.green }} />
            <span style={{ color: C.green, fontWeight: 800, minWidth: 44, fontSize: 20 }}>{goalsEdit.invPct}%</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div><label style={sx.label}>Saldo emergencia</label><input style={sx.input} type="number" value={goalsEdit.emBal} onChange={(e) => setGoalsEdit((p) => ({ ...p, emBal: e.target.value }))} /></div>
            <div><label style={sx.label}>Saldo inversiones</label><input style={sx.input} type="number" value={goalsEdit.invBal} onChange={(e) => setGoalsEdit((p) => ({ ...p, invBal: e.target.value }))} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...sx.btn(), flex: 1, justifyContent: "center" }} onClick={saveGoals}>Guardar</button>
            <button style={sx.btn("#374151")} onClick={() => setEditGoals(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Fondo emergencia */}
      <div style={sx.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 30 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Fondo de Emergencia</div>
            <div style={{ fontSize: 12, color: C.dim }}>Meta: {user.goals.emMonths} meses · {fmt(emGoal)}</div>
          </div>
        </div>
        <div style={{ ...sx.row, marginBottom: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: C.blue }}>{fmt(user.goals.emBal)}</span>
          <span style={{ color: C.dim, fontSize: 13 }}>/ {fmt(emGoal)}</span>
        </div>
        <ProgBar pct={emPct} color="linear-gradient(90deg,#1d4ed8,#60a5fa)" h={10} />
        <div style={{ ...sx.row, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: C.muted }}>{emPct.toFixed(0)}% alcanzado</span>
          {emGoal > 0 && emPct < 100 && (
            <span style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>
              Faltan {fmt(emGoal - user.goals.emBal)} ≈ {Math.ceil((emGoal - user.goals.emBal) / (user.income * 0.10))} meses
            </span>
          )}
          {emPct >= 100 && <span style={sx.pill(C.green)}>🎉 ¡Meta lograda!</span>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input style={{ ...sx.input, flex: 1 }} type="number" placeholder="Sumar al fondo..." value={emAdd} onChange={(e) => setEmAdd(e.target.value)} />
          <button style={{ ...sx.btn(C.blue), borderRadius: 10, padding: "10px 14px" }}
            onClick={() => { const v = +emAdd; if (v > 0) { dispatch({ type: "UPD", data: { goals: { ...user.goals, emBal: user.goals.emBal + v } } }); setEmAdd(""); } }}>+ Sumar</button>
        </div>
      </div>

      {/* Inversiones */}
      <div style={sx.card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 30 }}>📈</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Inversiones</div>
            <div style={{ fontSize: 12, color: C.dim }}>Aportando {fmt(invMonthly)}/mes ({user.goals.invPct}%)</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: C.green }}>{fmt(user.goals.invBal)}</span>
        </div>
        <div style={{ background: "#1f2937", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: C.muted }}>En 12 meses (proyección lineal)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.green, marginTop: 2 }}>{fmt(user.goals.invBal + invMonthly * 12)}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...sx.input, flex: 1 }} type="number" placeholder="Registrar inversión..." value={invAdd} onChange={(e) => setInvAdd(e.target.value)} />
          <button style={{ ...sx.btn(C.green), borderRadius: 10, padding: "10px 14px" }}
            onClick={() => { const v = +invAdd; if (v > 0) { dispatch({ type: "UPD", data: { goals: { ...user.goals, invBal: user.goals.invBal + v } } }); setInvAdd(""); } }}>+ Sumar</button>
        </div>
      </div>

      {/* Proyección */}
      <div style={sx.card}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>📊 Proyección próximos 6 meses</div>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={projection} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={{ fill: C.dim, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} />
            <Tooltip formatter={(v, n) => [fmt(v), n === "emergencia" ? "🛡️ Emergencia" : "📈 Inversiones"]} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: C.text, fontSize: 12 }} />
            <Area type="monotone" dataKey="emergencia" stroke={C.blue} fill="url(#gE)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="inversiones" stroke={C.green} fill="url(#gI)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Patrimonio */}
      <div style={sx.card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Patrimonio acumulado</div>
        {[
          { label: "Fondo de emergencia", val: user.goals.emBal, color: C.blue, icon: "🛡️" },
          { label: "Inversiones",          val: user.goals.invBal, color: C.green, icon: "📈" },
          { label: "Total ahorrado",       val: user.goals.emBal + user.goals.invBal, color: C.amber, icon: "💰", bold: true },
        ].map((item) => (
          <div key={item.label} style={{ ...sx.row, padding: "10px 0", borderBottom: item.bold ? "none" : "1px solid #1f2937" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: item.bold ? 700 : 400, color: item.bold ? C.text : C.muted }}>{item.label}</span>
            </div>
            <span style={{ fontWeight: item.bold ? 800 : 600, color: item.color, fontSize: item.bold ? 18 : 14 }}>{fmt(item.val)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── TAB: TIPS ──────────────────────────────────────────────────────────────
  const tabTips = () => (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>💡 Educación financiera</div>
      <div style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>Principios de los mejores libros de finanzas personales</div>

      {/* Diagnóstico personalizado */}
      <div style={{ ...sx.card, background: "#0f1a2e", borderColor: "#1e3a5f", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: 10 }}>🔍 Tu diagnóstico personalizado</div>
        {user.income > 0 && totalFixed / user.income > 0.7 && (
          <div style={{ fontSize: 13, color: C.amber, marginBottom: 8, lineHeight: 1.5 }}>⚠️ Tus gastos fijos superan el 70% del ingreso. Buscá reducir al menos una categoría fija para ganar margen de ahorro.</div>
        )}
        {user.debts.length > 0 && (
          <div style={{ fontSize: 13, color: C.amber, marginBottom: 8, lineHeight: 1.5 }}>💳 Tenés {user.debts.length} deuda(s) activa(s). Método recomendado: Bola de Nieve — atacá la más pequeña primero.</div>
        )}
        {emGoal > 0 && emPct < 50 && (
          <div style={{ fontSize: 13, color: C.blue, marginBottom: 8, lineHeight: 1.5 }}>🛡️ Tu fondo de emergencia está al {emPct.toFixed(0)}%. Priorizá completarlo antes de invertir más.</div>
        )}
        {user.goals.invPct < 10 && (
          <div style={{ fontSize: 13, color: C.red, marginBottom: 8, lineHeight: 1.5 }}>📈 Estás invirtiendo menos del 10% del ingreso. Intentá subir al menos 5% el mes que viene.</div>
        )}
        {score >= 75 && (
          <div style={{ fontSize: 13, color: C.green, lineHeight: 1.5 }}>🌟 ¡Tus finanzas van muy bien! Mantené la disciplina y pensá en diversificar tus inversiones.</div>
        )}
        {score < 40 && (
          <div style={{ fontSize: 13, color: C.red, lineHeight: 1.5 }}>🚨 Tus finanzas necesitan atención urgente. Empezá por registrar todos tus gastos y reducir los fijos.</div>
        )}
      </div>

      {/* Tip destacado con navegación */}
      <div style={{ ...sx.card, background: "linear-gradient(135deg,#0f2027,#0d1f3c)", borderColor: "#1e3a5f", marginBottom: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>{TIPS[tipIdx].icon}</div>
        <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>📚 {TIPS[tipIdx].from}</div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{TIPS[tipIdx].tip}</div>
        <div style={{ ...sx.row, marginTop: 16 }}>
          <button style={{ background: "none", border: "1px solid #374151", color: C.muted, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}
            onClick={() => setTipIdx((i) => (i - 1 + TIPS.length) % TIPS.length)}>← Anterior</button>
          <span style={{ fontSize: 11, color: C.dim }}>{tipIdx + 1} / {TIPS.length}</span>
          <button style={{ background: "none", border: "1px solid #374151", color: C.muted, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}
            onClick={() => setTipIdx((i) => (i + 1) % TIPS.length)}>Siguiente →</button>
        </div>
      </div>

      {/* Lista de todos los tips */}
      {TIPS.map((t, i) => (
        <div key={i} onClick={() => setTipIdx(i)} style={{ ...sx.card, cursor: "pointer", opacity: i === tipIdx ? 1 : 0.65, transition: "opacity 0.2s", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{t.from}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{t.tip.slice(0, 100)}…</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB: ASESOR ────────────────────────────────────────────────────────────
  const tabAsesor = () => {
    // Diagnóstico personalizado
    const debtRatio    = user.income > 0 ? (totalDebtMo / user.income) * 100 : 0;
    const fixedRatio   = user.income > 0 ? (totalFixed / user.income) * 100 : 0;
    const totalBurden  = debtRatio + fixedRatio;
    const freeRatio    = 100 - totalBurden;
    const emGoalLocal  = (totalFixed + totalDebtMo) * user.goals.emMonths;
    const emPctLocal   = emGoalLocal > 0 ? (user.goals.emBal / emGoalLocal) * 100 : 0;
    const surplus      = remaining > 0 ? remaining : 0;

    // Distribución recomendada del dinero extra
    const needsEM      = emPctLocal < 100;
    const hasDebts     = user.debts.length > 0;
    const emShare      = needsEM ? 0.4 : 0;
    const debtShare    = hasDebts ? 0.3 : 0;
    const invShare     = 1 - emShare - debtShare;

    // Orden bola de nieve
    const snowball = [...user.debts].sort((a, b) => {
      const remA = ((a.cuotas||0) - (a.cuotasPagadas||0)) * (+a.monthly||0);
      const remB = ((b.cuotas||0) - (b.cuotasPagadas||0)) * (+b.monthly||0);
      return remA - remB;
    });

    const statusColor = freeRatio > 30 ? "#10b981" : freeRatio > 10 ? "#f59e0b" : "#ef4444";
    const statusText  = freeRatio > 30 ? "Excelente margen" : freeRatio > 10 ? "Margen ajustado" : "Situación crítica";

    return (
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>🤖 Tu asesor financiero</div>

        {/* Diagnóstico */}
        <div style={{ background: "#111827", border: `1px solid ${statusColor}44`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: statusColor, marginBottom: 8 }}>📋 Diagnóstico de tu situación</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              { label: "% en gastos fijos", val: fixedRatio.toFixed(0) + "%", ok: fixedRatio < 50, icon: "🏠" },
              { label: "% en deudas", val: debtRatio.toFixed(0) + "%", ok: debtRatio < 15, icon: "💳" },
              { label: "% libre", val: freeRatio.toFixed(0) + "%", ok: freeRatio > 20, icon: "💰" },
              { label: "Fondo emergencia", val: emPctLocal.toFixed(0) + "%", ok: emPctLocal >= 100, icon: "🛡️" },
            ].map((m) => (
              <div key={m.label} style={{ background: "#1f2937", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontWeight: 800, color: m.ok ? "#10b981" : "#ef4444", fontSize: 16 }}>{m.val}</div>
              </div>
            ))}
          </div>
          {freeRatio < 10 && (
            <div style={{ background: "#1a0f0f", borderRadius: 10, padding: 10, fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>
              ⚠️ Más del 90% de tu ingreso está comprometido. Prioridad #1: reducir gastos fijos o aumentar ingresos.
            </div>
          )}
          {freeRatio >= 10 && freeRatio < 30 && (
            <div style={{ background: "#1c1500", borderRadius: 10, padding: 10, fontSize: 12, color: "#fcd34d", lineHeight: 1.5 }}>
              ⚡ Tenés margen pero es ajustado. Evitá nuevas deudas y optimizá gastos.
            </div>
          )}
          {freeRatio >= 30 && (
            <div style={{ background: "#0a1f14", borderRadius: 10, padding: 10, fontSize: 12, color: "#6ee7b7", lineHeight: 1.5 }}>
              ✅ Tenés buen margen libre. Es el momento ideal para hacer trabajar tu dinero.
            </div>
          )}
        </div>

        {/* Qué hacer con dinero extra */}
        {surplus > 0 && (
          <div style={{ background: "#0a1f14", border: "1px solid #065f46", borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: "#10b981", marginBottom: 4, fontSize: 14 }}>💡 ¿Qué hacés con {fmt(surplus)} disponibles?</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>Distribución recomendada según tu situación actual:</div>
            {[
              needsEM && { label: "🛡️ Fondo de emergencia", pct: 40, color: "#3b82f6", reason: "Todavía no alcanzaste tu colchón de seguridad" },
              hasDebts && { label: "💳 Pago extra de deudas", pct: 30, color: "#ef4444", reason: snowball[0] ? `Atacá primero: ${snowball[0].name}` : "Deuda más pequeña primero (bola de nieve)" },
              { label: "📈 Inversiones", pct: Math.round(invShare * 100), color: "#10b981", reason: "El dinero que no trabajas pierde valor" },
            ].filter(Boolean).map((item) => (
              <div key={item.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: item.color }}>{item.label}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(surplus * item.pct / 100)} <span style={{ color: "#6b7280", fontWeight: 400 }}>({item.pct}%)</span></span>
                </div>
                <div style={{ background: "#1f2937", borderRadius: 999, overflow: "hidden", height: 6 }}>
                  <div style={{ height: "100%", borderRadius: 999, width: `${item.pct}%`, background: item.color }} />
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{item.reason}</div>
              </div>
            ))}
          </div>
        )}

        {/* Opciones de inversión */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: "#10b981", marginBottom: 4, fontSize: 14 }}>📈 ¿En qué invertir?</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>De menor a mayor riesgo. Siempre educate antes de invertir.</div>
          {[
            { icon: "🏦", name: "Plazo Fijo / FCI", risk: "Bajo", desc: "Ideal para el fondo de emergencia. En Argentina buscá FCI Money Market o Plazo Fijo UVA para cubrirte de la inflación.", where: "Banco, Mercado Pago, Ualá, Naranja X" },
            { icon: "📊", name: "CEDEARs", risk: "Medio", desc: "Comprás acciones de empresas USA (Apple, Google, Tesla) desde Argentina, en pesos. La mejor protección contra la inflación y el dólar.", where: "Invertir Online, Bull Market, PPI, Balanz" },
            { icon: "💵", name: "Dólar / Stablecoins", risk: "Medio", desc: "Dolarizá parte de tus ahorros. Las stablecoins (USDT, USDC) son ideales si no querés billetes físicos.", where: "Lemon Cash, Belo, Ripio, exchange local" },
            { icon: "🏠", name: "Ladrillo / propiedades", risk: "Bajo-Medio", desc: "La inversión clásica en Argentina. Requiere más capital inicial pero es muy sólida a largo plazo.", where: "Mercado Libre Inmuebles, Zonaprop, argenprop" },
            { icon: "🚀", name: "Cripto (BTC, ETH)", risk: "Alto", desc: "Alta volatilidad. Solo invertí lo que estás dispuesto a perder. Para perfiles agresivos con horizonte largo.", where: "Lemon Cash, Binance, Ripio, Belo" },
            { icon: "🧠", name: "Invertí en vos mismo", risk: "Cero", desc: "El mejor retorno. Un curso, una carrera, una habilidad: multiplicás tu capacidad de generar ingresos.", where: "Udemy, Coursera, universidades, YouTube" },
          ].map((inv) => (
            <div key={inv.name} style={{ padding: "12px 0", borderBottom: "1px solid #1f2937" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{inv.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{inv.name}</span>
                    <span style={{ fontSize: 10, background: inv.risk === "Bajo" ? "#065f46" : inv.risk === "Medio" || inv.risk === "Bajo-Medio" ? "#78350f" : "#7f1d1d", color: inv.risk === "Bajo" ? "#6ee7b7" : inv.risk === "Medio" || inv.risk === "Bajo-Medio" ? "#fcd34d" : "#fca5a5", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>
                      Riesgo: {inv.risk}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, marginBottom: 4 }}>{inv.desc}</div>
                  <div style={{ fontSize: 11, color: "#3b82f6" }}>📍 Dónde: {inv.where}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cómo generar más ingresos */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: "#f59e0b", marginBottom: 4, fontSize: 14 }}>💼 ¿Cómo ganar más dinero?</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>La mejor estrategia financiera es aumentar tus ingresos mientras controlás los gastos.</div>
          {[
            { icon: "💻", label: "Freelance / servicios online", desc: "Programación, diseño, redacción, marketing, traducción. Plataformas: Workana, Fiverr, Upwork, LinkedIn." },
            { icon: "📦", label: "Compra-venta", desc: "Comprá en ferias, fabricantes o importadores y vendé con margen. Mercado Libre es el canal más potente." },
            { icon: "📱", label: "Creación de contenido", desc: "YouTube, Instagram, TikTok: monetización, sponsors, afiliados. Requiere tiempo pero el ingreso es pasivo a largo plazo." },
            { icon: "🏫", label: "Dar clases / tutorías", desc: "Lo que sabés vale dinero. Clases particulares, talleres online, cursos grabados en Hotmart o Udemy." },
            { icon: "🔧", label: "Servicios locales", desc: "Plomería, electricidad, pintura, limpieza, delivery. Alta demanda y entrada inmediata." },
            { icon: "📊", label: "Invertir en capacitación", desc: "Una nueva habilidad puede duplicar tu sueldo. Identificá qué habilidades escasean en tu área y aprendelas." },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #1f2937" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips de libros */}
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: "#8b5cf6", marginBottom: 12, fontSize: 14 }}>📚 Sabiduría de los mejores libros</div>
          {[
            { icon: "🏺", from: "El Hombre Más Rico de Babilonia", tip: "Paga primero a ti mismo: guardá el 10% de todo lo que ganás ANTES de gastar. Si vivís solo con el 90%, te adaptás. Si esperás 'lo que sobre', nunca habrá nada." },
            { icon: "📊", from: "Regla 50/30/20 — Elizabeth Warren", tip: "50% necesidades, 30% gustos, 20% ahorro e inversión. El esquema más sencillo y efectivo para ordenar el dinero sin privarte de vivir." },
            { icon: "🏔️", from: "Total Money Makeover — Dave Ramsey", tip: "Bola de Nieve: listá deudas de menor a mayor. Pagá el mínimo en todas y volcá todo el excedente a la más pequeña. El impulso psicológico es real y poderoso." },
            { icon: "🧠", from: "Padre Rico, Padre Pobre — Kiyosaki", tip: "Un activo te mete dinero en el bolsillo. Un pasivo te lo saca. El auto, la ropa cara, la TV: pasivos. Una propiedad que alquilás, inversiones, un negocio: activos." },
            { icon: "⚡", from: "Psicología del Dinero — Morgan Housel", tip: "El ahorro no requiere un ingreso alto, requiere controlar el ego. Cada peso no gastado es un peso que se multiplica en el tiempo." },
            { icon: "🔄", from: "I Will Teach You to Be Rich — Ramit Sethi", tip: "Automatizá tus ahorros el mismo día que cobrás. Si el dinero nunca llega a tu cuenta de gastos, no lo vas a gastar." },
          ].map((t, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: i < 5 ? "1px solid #1f2937" : "none" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 10, color: "#8b5cf6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{t.from}</div>
                  <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{t.tip}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── RENDER PRINCIPAL ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", background: C.bg, minHeight: "100vh", color: C.text, display: "flex", flexDirection: "column", maxWidth: 440, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px 12px", background: "#0f1729", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>FinanSmart 💸</div>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{user.name}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.dim }}>Disponible</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: remaining >= 0 ? C.green : C.red }}>{fmt(Math.max(remaining, 0))}</div>
          </div>
          <button style={{ background: "#1f2937", border: "none", color: C.muted, borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontSize: 16 }}
            onClick={() => setShowSettings(!showSettings)}>⚙️</button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, margin: "0 14px 4px", padding: 16 }}>
          {confirmDel ? (
            <div>
              <div style={{ fontSize: 14, color: C.red, fontWeight: 700, marginBottom: 12 }}>⚠️ ¿Eliminar el perfil de {user.name}?</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Esta acción no se puede deshacer. Todos tus datos se perderán.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...sx.btn(C.red), flex: 1, justifyContent: "center" }} onClick={() => { dispatch({ type: "DEL_USER", id: user.id }); setConfirmDel(false); setShowSettings(false); }}>Sí, eliminar</button>
                <button style={{ ...sx.btn("#374151") }} onClick={() => setConfirmDel(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>⚙️ Configuración</div>
              <label style={sx.label}>Ingreso mensual</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input style={{ ...sx.input, flex: 1 }} type="number" value={incomeEdit} onChange={(e) => setIncomeEdit(e.target.value)} />
                <button style={{ ...sx.btn(), borderRadius: 10, padding: "10px 14px" }}
                  onClick={() => { if (+incomeEdit > 0) { dispatch({ type: "UPD", data: { income: +incomeEdit } }); setShowSettings(false); } }}>✓</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={{ ...sx.btn(C.blue), justifyContent: "center" }} onClick={() => { exportJSON(state); setShowSettings(false); }}>💾 Exportar mis datos (backup)</button>
                <button style={{ ...sx.btn("#374151"), justifyContent: "center" }} onClick={() => { dispatch({ type: "LOGOUT" }); setShowSettings(false); }}>👤 Cambiar de usuario</button>
                <button style={{ ...sx.btn(C.red), justifyContent: "center" }} onClick={() => setConfirmDel(true)}>🗑 Eliminar mi perfil</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: "16px 16px 90px", overflowY: "auto" }}>
        {tab === "inicio"  && tabInicio()}
        {tab === "fijos"   && tabFijos()}
        {tab === "diarios" && tabDiarios()}
        {tab === "deudas"  && tabDeudas()}
        {tab === "asesor"  && tabAsesor()}
      </div>

      {/* Bottom navigation */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 440, background: "#0d1117", borderTop: "1px solid #1f2937", display: "flex", padding: "8px 0 14px", zIndex: 100 }}>
        {TABS.map((t) => (
          <button key={t.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: tab === t.id ? C.green : "#4b5563", padding: "4px 0" }}
            onClick={() => { setTab(t.id); setShowSettings(false); }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN: FIREBASE LOGIN
// ─────────────────────────────────────────────────────────────────────────────

function FirebaseLoginScreen() {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const wrap  = { fontFamily: "'Inter',-apple-system,sans-serif", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, color: C.text };
  const card  = { background: "#111827", border: "1px solid #1f2937", borderRadius: 20, padding: 28, width: "100%", maxWidth: 380 };

  const doGoogle = async () => {
    setError(""); setLoading(true);
    try { await loginGoogle(); } catch (e) { setError("Error con Google. Intentá de nuevo."); }
    setLoading(false);
  };

  const doEmail = async () => {
    if (!email || !pass) return setError("Completá email y contraseña.");
    setError(""); setLoading(true);
    try {
      if (mode === "login") await loginEmail(email, pass);
      else await registerEmail(email, pass);
    } catch (e) {
      setError(e.code === "auth/wrong-password" || e.code === "auth/user-not-found"
        ? "Email o contraseña incorrectos."
        : e.code === "auth/email-already-in-use"
        ? "Ese email ya tiene cuenta. Iniciá sesión."
        : "Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={wrap}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 60, marginBottom: 8 }}>💸</div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>FinanSmart</div>
        <div style={{ fontSize: 14, color: C.dim, marginTop: 4 }}>Controlá tu dinero · Construí tu futuro</div>
      </div>

      <div style={card}>
        <button
          onClick={doGoogle}
          disabled={loading}
          style={{ ...sx.btn("#fff"), color: "#111", width: "100%", justifyContent: "center", marginBottom: 20, fontSize: 15, padding: "13px 0" }}>
          <span>🔵</span> {loading ? "Cargando..." : "Continuar con Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#374151" }} />
          <span style={{ color: C.dim, fontSize: 12 }}>o con email</span>
          <div style={{ flex: 1, height: 1, background: "#374151" }} />
        </div>

        <label style={sx.label}>Email</label>
        <input style={{ ...sx.input, marginBottom: 12 }} type="email" placeholder="tu@email.com"
          value={email} onChange={e => setEmail(e.target.value)} />

        <label style={sx.label}>Contraseña</label>
        <input style={{ ...sx.input, marginBottom: 16 }} type="password" placeholder="••••••••"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doEmail()} />

        {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</div>}

        <button onClick={doEmail} disabled={loading}
          style={{ ...sx.btn(), width: "100%", justifyContent: "center", fontSize: 15, padding: "13px 0", marginBottom: 14 }}>
          {loading ? "..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: C.muted }}>
          {mode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
          <span style={{ color: C.green, cursor: "pointer", fontWeight: 600 }}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Registrate" : "Iniciá sesión"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch]   = useReducer(reduce, INIT);
  const [fbUser, setFbUser] = useState(undefined); // undefined=cargando, null=no logueado
  const initialized         = useRef(false);
  const saving              = useRef(false);

  // Escucha cambios de auth de Firebase
  useEffect(() => {
    const unsub = onAuth(async (u) => {
      setFbUser(u);
      if (!u) { initialized.current = false; return; }
      // Carga datos desde Firestore
      const data = await loadUserData(u.uid);
      if (data) {
        dispatch({ type: "IMPORT", data });
      } else {
        // Usuario nuevo: crear perfil con UID de Firebase
        dispatch({ type: "CREATE_FB", uid: u.uid, name: u.displayName || u.email?.split("@")[0] || "Usuario" });
      }
      initialized.current = true;
    });
    return unsub;
  }, []);

  // Guarda en Firestore cada vez que cambia el estado (después de inicializar)
  useEffect(() => {
    if (!fbUser || !initialized.current || saving.current) return;
    saving.current = true;
    saveUserData(fbUser.uid, state).finally(() => { saving.current = false; });
  }, [state, fbUser]);

  // Pantalla de carga
  if (fbUser === undefined) {
    return (
      <div style={{ background: "#0a0e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#f1f5f9", fontFamily: "'Inter',sans-serif" }}>
        <div style={{ fontSize: 52 }}>💸</div>
        <div style={{ fontSize: 16, color: "#6b7280" }}>Cargando FinanSmart...</div>
      </div>
    );
  }

  if (!fbUser) return <FirebaseLoginScreen />;

  const user = state.users.find((u) => u.id === state.uid);

  // Usuario nuevo: mostrar formulario de perfil (nombre ya viene de Firebase)
  if (!state.uid || !user) return <LoginScreen state={state} dispatch={dispatch} />;
  if (!user.onboarded)     return <OnboardingScreen user={user} dispatch={dispatch} />;

  // Agregar botón de cerrar sesión en el dispatch original
  const dispatchWithLogout = (action) => {
    if (action.type === "LOGOUT") { logout(); return; }
    dispatch(action);
  };

  return <MainApp user={user} state={state} dispatch={dispatchWithLogout} />;
}
