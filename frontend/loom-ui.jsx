import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Cpu, Server, Layout as LayoutIcon, Database, TestTube2, GitMerge, Rocket, DollarSign, Activity, ChevronRight, Lock, Mail, Settings, Plus, User } from "lucide-react";

/* ---------- tokens ---------- */
const T = {
  bg: "#0A0D12",
  surface: "#131820",
  card: "#1A2029",
  border: "#232A35",
  teal: "#2EE6A8",
  blue: "#3B9EFF",
  success: "#22C55E",
  warning: "#F5A524",
  error: "#F5484D",
  info: "#4C8BF5",
  text: "#F5F7FA",
  textSec: "#9AA5B1",
  textMuted: "#5B6472",
};

const FONT_HEAD = "'Space Grotesk', 'Inter', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function api(path, { token, method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Cannot reach the API at ${API_URL}. Start the backend and check VITE_API_URL.`);
  }
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && token && path !== "/auth/refresh") {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    });
    const refreshPayload = await refreshResponse.json().catch(() => ({}));
    const accessToken = refreshPayload.data?.accessToken;
    if (refreshResponse.ok && accessToken) {
      localStorage.setItem("loom_access_token", accessToken);
      window.dispatchEvent(new CustomEvent("loom-token-refreshed", { detail: accessToken }));
      return api(path, { token: accessToken, method, body });
    }
    localStorage.removeItem("loom_access_token");
    window.dispatchEvent(new CustomEvent("loom-token-refreshed", { detail: "" }));
  }
  if (!response.ok) {
    const error = new Error(payload.error?.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

const glass = (op = 0.08) => ({
  background: `linear-gradient(135deg, rgba(255,255,255,${op + 0.02}), rgba(255,255,255,${op - 0.05 > 0 ? op - 0.05 : 0.02}))`,
  backdropFilter: "blur(18px) saturate(170%)",
  WebkitBackdropFilter: "blur(18px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
});

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
    @keyframes loomDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-18px) scale(1.04); } }
    @keyframes loomDrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-18px,12px) scale(1.03); } }
    @keyframes loomBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    @keyframes loomFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .loom-fade { animation: loomFade 500ms cubic-bezier(0.16,1,0.3,1) both; }
    * { box-sizing: border-box; }
    html, body, #root { min-height: 100%; margin: 0; background: #080d14; }
    input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {
      -webkit-text-fill-color: #f5f7fa; -webkit-box-shadow: 0 0 0 1000px #101722 inset; transition: background-color 5000s ease-in-out 0s;
    }
    .auth-layout { width: min(1040px, calc(100vw - 48px)); min-height: 620px; display: grid; grid-template-columns: 1.1fr .9fr; overflow: hidden; border: 1px solid rgba(151, 169, 197, .20); border-radius: 28px; background: rgba(13,20,31,.88); box-shadow: 0 30px 80px rgba(0,0,0,.42); }
    .auth-brief { padding: 54px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(145deg, rgba(41,226,190,.13), rgba(36,55,116,.04) 60%); border-right: 1px solid rgba(151,169,197,.14); }
    .auth-form { display: flex; align-items: center; padding: 42px; background: rgba(11,17,27,.72); }
    @media (max-width: 760px) { .auth-layout { width: min(440px, calc(100vw - 28px)); grid-template-columns: 1fr; min-height: auto; } .auth-brief { display: none; } .auth-form { padding: 30px 24px; } }
    @media (prefers-reduced-motion: reduce) {
      .loom-orb { animation: none !important; }
      .loom-fade { animation: none !important; }
    }
  `}</style>
);

/* ---------- background ---------- */
function Background({ dense }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0, borderRadius: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: T.bg }} />
      <div className="loom-orb" style={{
        position: "absolute", width: 340, height: 340, borderRadius: "50%", top: -80, left: -60,
        background: `radial-gradient(circle, ${T.teal}33, transparent 70%)`, filter: "blur(70px)",
        animation: "loomDrift 60s ease-in-out infinite",
      }} />
      <div className="loom-orb" style={{
        position: "absolute", width: 380, height: 380, borderRadius: "50%", bottom: -100, right: -80,
        background: `radial-gradient(circle, ${T.blue}2E, transparent 70%)`, filter: "blur(80px)",
        animation: "loomDrift2 75s ease-in-out infinite",
      }} />
      <div className="loom-orb" style={{
        position: "absolute", width: 20, height: 20, borderRadius: "50%", top: "40%", left: "60%",
        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", filter: "blur(1px)",
        animation: "loomDrift 45s ease-in-out infinite",
      }} />
      {dense && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.035 }}>
          <defs>
            <pattern id="loomgrid" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loomgrid)" />
        </svg>
      )}
    </div>
  );
}

/* ---------- agent data ---------- */
const AGENTS_SEED = [
  { id: "orch", name: "Orchestrator", icon: Cpu, role: "Task decomposition", provider: "paid", model: "Claude Sonnet 5", status: "working", task: "Building dependency graph for auth flow" },
  { id: "be", name: "Backend", icon: Server, role: "API + business logic", provider: "paid", model: "Claude Sonnet 5", status: "working", task: "Writing POST /api/auth/login route" },
  { id: "fe", name: "Frontend", icon: LayoutIcon, role: "UI components", provider: "free", model: "Llama 3.1 (local)", status: "idle", task: "Waiting on API contract" },
  { id: "db", name: "Database", icon: Database, role: "Schema + migrations", provider: "free", model: "Groq · Llama 3.1", status: "done", task: "users, sessions tables created" },
  { id: "test", name: "Testing", icon: TestTube2, role: "Test generation", provider: "free", model: "Llama 3.1 (local)", status: "idle", task: "Waiting on Backend output" },
  { id: "rev", name: "Reviewer", icon: GitMerge, role: "Integration + conflicts", provider: "paid", model: "Claude Sonnet 5", status: "error", task: "camelCase / snake_case mismatch found" },
  { id: "planner", name: "Planner", icon: Activity, role: "Goals + dependencies", provider: "paid", model: "Claude Sonnet 5", status: "idle", task: "Task decomposition and scheduling" },
  { id: "research", name: "Research", icon: TestTube2, role: "Deep research", provider: "free", model: "Groq", status: "idle", task: "Researches sources and trends" },
  { id: "search", name: "Search", icon: Activity, role: "Web + API retrieval", provider: "free", model: "Groq", status: "idle", task: "Finds current information" },
  { id: "memory", name: "Memory", icon: Cpu, role: "Context + preferences", provider: "free", model: "Groq", status: "idle", task: "Manages durable context" },
  { id: "rag", name: "RAG", icon: Database, role: "Vector retrieval", provider: "paid", model: "Claude Sonnet 5", status: "idle", task: "Grounds answers in documents" },
  { id: "file", name: "File", icon: Plus, role: "Upload + parsing", provider: "free", model: "Groq", status: "idle", task: "Processes project documents" },
  { id: "vision", name: "Vision", icon: Activity, role: "OCR + image analysis", provider: "paid", model: "Claude Sonnet 5", status: "idle", task: "Understands visual input" },
  { id: "coding", name: "Coding", icon: Server, role: "Generate + debug code", provider: "paid", model: "Claude Sonnet 5", status: "idle", task: "Builds implementation artifacts" },
  { id: "api-manager", name: "API Manager", icon: Settings, role: "External integrations", provider: "paid", model: "Claude Sonnet 5", status: "idle", task: "Connects APIs safely" },
  { id: "cloud-devops", name: "Cloud & DevOps", icon: Server, role: "Deploy + observe", provider: "paid", model: "Claude Sonnet 5", status: "idle", task: "Manages infrastructure" },
  { id: "finance", name: "Finance", icon: DollarSign, role: "Cost + budgets", provider: "free", model: "Groq", status: "idle", task: "Optimizes cloud spend" },
  { id: "email", name: "Email", icon: Mail, role: "Messages + notifications", provider: "free", model: "Groq", status: "idle", task: "Delivers communications" },
];

const STATUS = {
  working: { color: T.info, label: "Active" },
  idle: { color: T.textMuted, label: "Idle" },
  done: { color: T.success, label: "Done" },
  error: { color: T.error, label: "Flagged" },
};

/* ---------- shared bits ---------- */
function Pill({ color, label, pulse }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999,
      background: `${color}1A`, border: `1px solid ${color}40`, fontSize: 12, fontWeight: 600, color,
      fontFamily: FONT_BODY,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, animation: pulse ? "loomBlink 1.2s ease-in-out infinite" : "none" }} />
      {label}
    </span>
  );
}

function IconButton({ icon: Icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", ...glass(0.07), transition: "all 200ms ease-out",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
      onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))"; }}
    >
      <Icon size={15} color="rgba(255,255,255,0.75)" />
    </button>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="loom-fade" style={{
      ...glass(0.07), borderRadius: 16, padding: "16px 20px", flex: 1, minWidth: 140,
      boxShadow: `0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px ${accent}26`,
    }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: T.textSec, marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 600, color: accent || T.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

/* ---------- dashboard: flat agent cards ---------- */
function AgentCard({ agent }) {
  const s = STATUS[agent.status];
  const Icon = agent.icon;
  const accent = agent.provider === "paid" ? T.blue : T.teal;
  return (
    <div className="loom-fade" style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16,
      transition: "border-color 200ms ease-out, background 200ms ease-out",
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            background: `${accent}1F`, border: `1px solid ${accent}40`,
          }}>
            <Icon size={16} color={accent} />
          </div>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: T.text }}>{agent.name}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: T.textMuted }}>{agent.role}</div>
          </div>
        </div>
        <Pill color={s.color} label={s.label} pulse={agent.status === "working"} />
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{agent.task}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: T.textMuted }}>{agent.model}</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: accent }}>{agent.provider === "paid" ? "Paid" : "Free"}</span>
      </div>
    </div>
  );
}

function Dashboard({ agents, project, files }) {
  const working = agents.filter(a => a.status === "working").length;
  const done = agents.filter(a => a.status === "done").length;
  const errors = agents.filter(a => a.status === "error").length;
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Active" value={working} accent={T.info} />
        <StatCard label="Done" value={done} accent={T.success} />
        <StatCard label="Flagged" value={errors} accent={T.error} />
        <StatCard label="Files" value={files.length} accent={T.teal} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {agents.map(a => <AgentCard key={a.id} agent={a} />)}
      </div>
      {project && <div style={{ marginTop: 18, fontFamily: FONT_BODY, color: T.textSec, fontSize: 13 }}>
        <strong style={{ color: T.text }}>{project.name}</strong> · {project.status}{project.integration_report?.explanation ? ` · ${project.integration_report.explanation}` : ""}
        {files.length > 0 && <div style={{ marginTop: 8, color: T.textMuted }}>Generated: {files.join(", ")}</div>}
      </div>}
    </div>
  );
}

/* ---------- providers: flat table ---------- */
function Providers({ agents, setAgents, onSave }) {
  const setProvider = (id, provider) => {
    setAgents(prev => prev.map(a => a.id === id ? {
      ...a, provider, model: provider === "paid" ? "Claude Sonnet 5" : "Groq · Llama 3.1"
    } : a));
    onSave?.(id === "be" ? "backend" : id === "fe" ? "frontend" : id === "db" ? "database" : id === "test" ? "testing" : id === "rev" ? "reviewer" : id, provider);
  };
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1fr auto", padding: "12px 18px",
        borderBottom: `1px solid ${T.border}`, background: T.surface,
        fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: T.textSec, textTransform: "uppercase",
      }}>
        <span>Agent</span><span>Model</span><span>Role</span><span style={{ textAlign: "right" }}>Route</span>
      </div>
      {agents.map((a, i) => (
        <div key={a.id} style={{
          display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1fr auto", padding: "14px 18px", alignItems: "center",
          borderBottom: i < agents.length - 1 ? `1px solid ${T.border}` : "none",
        }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 9 }}>
            <a.icon size={14} color={a.provider === "paid" ? T.blue : T.teal} /> {a.name}
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: T.textSec }}>{a.model}</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: T.textMuted }}>{a.role}</span>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            {["free", "paid"].map(p => (
              <button key={p} onClick={() => setProvider(a.id, p)} style={{
                fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, padding: "6px 12px", borderRadius: 7, cursor: "pointer",
                background: a.provider === p ? (p === "paid" ? T.blue : T.teal) : "transparent",
                color: a.provider === p ? "#08110D" : T.textSec,
                border: `1px solid ${a.provider === p ? "transparent" : T.border}`,
                transition: "all 180ms ease-out",
              }}>{p === "paid" ? "Paid" : "Free"}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({ configured, model, onSave, busy }) {
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const save = async (event) => {
    event.preventDefault(); setMessage("");
    try { await onSave(apiKey); setApiKey(""); setMessage("Saved. Groq is ready for new builds."); }
    catch (err) { setMessage(err.message); }
  };
  return <form onSubmit={save} style={{ maxWidth: 560, ...glass(0.07), borderRadius: 20, padding: 24 }}>
    <div style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: T.text }}>Groq API key</div>
    <p style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: T.textSec, margin: "8px 0 18px" }}>{configured ? `Connected to ${model}. Add a new key to replace it.` : "Add a Groq key to run the free agent route."}</p>
    <label style={{ display: "block", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 7 }}>API key</label>
    <input type="password" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="gsk_..." required minLength={20} style={{ width: "100%", borderRadius: 10, padding: 13, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: FONT_MONO, fontSize: 13, outline: "none" }} />
    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.textMuted, marginTop: 10 }}>The key is sent to the backend and is never displayed again.</div>
    {message && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: message.startsWith("Saved") ? T.success : T.error, marginTop: 12 }}>{message}</div>}
    <button disabled={busy || apiKey.trim().length < 20} type="submit" style={{ marginTop: 18, padding: "11px 16px", borderRadius: 9, border: "none", background: T.teal, color: "#08150F", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: busy || apiKey.trim().length < 20 ? 0.5 : 1 }}>Save Groq key</button>
  </form>;
}

/* ---------- new build: glass hero + flat form ---------- */
function NewProject({ onLaunch, busy }) {
  const [name, setName] = useState("");
  const [spec, setSpec] = useState("");
  return (
    <div style={{ maxWidth: 640, ...glass(0.07), borderRadius: 20, padding: 24, boxShadow: `0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px ${T.teal}1F` }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: T.textSec, marginBottom: 10, textTransform: "uppercase" }}>Project spec</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, padding: 13, marginBottom: 12, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: FONT_BODY, fontSize: 14, outline: "none" }} />
      <textarea
        value={spec}
        onChange={(e) => setSpec(e.target.value)}
        placeholder="Todo app with auth, Postgres storage, and a React dashboard"
        rows={5}
        style={{
          width: "100%", boxSizing: "border-box", resize: "vertical", borderRadius: 10, padding: 13,
          background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: FONT_BODY,
          fontSize: 14, outline: "none", lineHeight: 1.6,
        }}
        onFocus={(e) => e.target.style.borderColor = T.teal}
        onBlur={(e) => e.target.style.borderColor = T.border}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {["Todo app + auth", "URL shortener", "Blog with comments", "Chat app"].map(t => (
          <button key={t} onClick={() => setSpec(t)} style={{
            fontFamily: FONT_BODY, fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 999,
            background: T.surface, border: `1px solid ${T.border}`, color: T.textSec, cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>
      <button disabled={busy || !name.trim() || spec.trim().length < 10} onClick={() => onLaunch({ name, spec })} style={{
        marginTop: 18, width: "100%", padding: "12px 0", borderRadius: 10, cursor: "pointer",
        background: T.teal, border: "none", color: "#08150F", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "transform 150ms ease-out",
      }}
        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <Rocket size={15} /> {busy ? "Planning and running…" : "Launch agents"}
      </button>
    </div>
  );
}

/* ---------- login ---------- */
function BrandLogo({ width = 155 }) {
  return <img src="/loom-mark.svg" alt="Loom" style={{ display: "block", width, height: "auto" }} />;
}

function Login({ onLogin, error, busy }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [focus, setFocus] = useState(null);
  const inputWrap = (name) => ({
    display: "flex", alignItems: "center", gap: 8, background: T.surface, borderRadius: 10,
    border: `1px solid ${focus === name ? T.teal : T.border}`,
    boxShadow: focus === name ? `0 0 0 3px ${T.teal}26` : "none",
    padding: "0 12px", marginBottom: 14, transition: "all 180ms ease-out",
  });
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 24 }}>
      <Background dense={false} />
      <div className="auth-layout loom-fade" style={{ position: "relative", zIndex: 1 }}>
        <aside className="auth-brief">
          <BrandLogo width={174} />
          <div>
            <div style={{ color: T.text, fontFamily: FONT_HEAD, fontSize: 38, lineHeight: 1.08, letterSpacing: "-0.04em", maxWidth: 360 }}>Weave your next build.</div>
            <p style={{ color: T.textSec, fontFamily: FONT_BODY, fontSize: 15, lineHeight: 1.65, marginTop: 18, maxWidth: 355 }}>Bring your ideas, research, files, and code together. Loom coordinates a focused team of AI specialists from a single brief.</p>
          </div>
          <div style={{ fontFamily: FONT_BODY, color: T.textMuted, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>Prompt it · Weave it · Build it</div>
        </aside>
        <main className="auth-form"><div style={{ width: "100%" }}>
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><BrandLogo width={128} /></div>
          <h1 style={{ color: T.text, fontFamily: FONT_HEAD, fontSize: 27, letterSpacing: "-0.03em", margin: 0 }}>{registering ? "Start building with Loom" : "Welcome back"}</h1>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: T.textSec, marginTop: 8 }}>{registering ? "Create an account to coordinate your agent team." : "Sign in to return to your workspace."}</div>
        </div>

        {registering && <div style={inputWrap("name")}><User size={15} color={T.textMuted} /><input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocus("name")} onBlur={() => setFocus(null)} placeholder="Your name" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, fontFamily: FONT_BODY, fontSize: 13.5, padding: "11px 0" }} /></div>}

        <div style={inputWrap("email")}>
          <Mail size={15} color={T.textMuted} />
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocus("email")} onBlur={() => setFocus(null)}
            placeholder="you@email.com" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, fontFamily: FONT_BODY, fontSize: 13.5, padding: "11px 0" }} />
        </div>
        <div style={inputWrap("pass")}>
          <Lock size={15} color={T.textMuted} />
          <input type="password" autoComplete={registering ? "new-password" : "current-password"} value={pass} onChange={(e) => setPass(e.target.value)} onFocus={() => setFocus("pass")} onBlur={() => setFocus(null)}
            placeholder="Password" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, fontFamily: FONT_BODY, fontSize: 13.5, padding: "11px 0" }} />
        </div>

        {!registering && <div style={{ textAlign: "right", marginTop: -3, marginBottom: 20 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.blue, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
        </div>}

        <button disabled={busy || !email.trim() || !pass || (registering && !name.trim())} onClick={() => onLogin(email.trim(), pass, name.trim(), registering)} style={{
          width: "100%", padding: "12px 0", borderRadius: 10, cursor: busy ? "wait" : "pointer", border: "none",
          opacity: busy || !email.trim() || !pass || (registering && !name.trim()) ? 0.55 : 1,
          background: T.teal, color: "#08150F", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700,
        }}>{busy ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>

        {error && <div role="alert" style={{ fontFamily: FONT_BODY, fontSize: 12.5, lineHeight: 1.45, color: "#ff9b9f", marginTop: 14, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(245,72,77,.28)", background: "rgba(245,72,77,.08)" }}>{error}</div>}

        <div style={{ fontFamily: FONT_BODY, textAlign: "center", fontSize: 12.5, color: T.textSec, marginTop: 18 }}>
          {registering ? "Already have an account?" : "New here?"} <span onClick={() => { setRegistering(!registering); setFocus(null); }} style={{ color: T.teal, fontWeight: 600, cursor: "pointer" }}>{registering ? "Sign in" : "Create an account"}</span>
        </div></div></main>
      </div>
    </div>
  );
}

/* ---------- nav ---------- */
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 13px",
      borderRadius: 9, border: "none", cursor: "pointer", marginBottom: 4, fontFamily: FONT_BODY,
      background: active ? `${T.teal}17` : "transparent",
      boxShadow: active ? `inset 0 0 0 1px ${T.teal}40` : "none",
      color: active ? T.text : T.textSec, fontSize: 13.5, fontWeight: 600, transition: "background 180ms ease-out",
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

/* ---------- app shell ---------- */
export default function Loom() {
  const [token, setToken] = useState(() => localStorage.getItem("loom_access_token") || "");
  const [view, setView] = useState("dashboard");
  const [agents, setAgents] = useState(AGENTS_SEED);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [groqSettings, setGroqSettings] = useState({ configured: false, model: "Groq" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api("/settings/providers", { token })
      .then((result) => setGroqSettings({ configured: result.groqConfigured, model: result.groqModel }))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const updateToken = (event) => {
      setToken(event.detail);
      if (!event.detail) setError("Your session expired. Please sign in again.");
    };
    window.addEventListener("loom-token-refreshed", updateToken);
    return () => window.removeEventListener("loom-token-refreshed", updateToken);
  }, []);

  const refreshProject = async (projectId) => {
    const result = await api(`/projects/${projectId}`, { token });
    setProject(result.project);
    const byAgent = Object.fromEntries(result.tasks.map((task) => [task.agent_name, task]));
    setAgents((current) => current.map((agent) => {
      const task = byAgent[agent.id === "be" ? "backend" : agent.id === "fe" ? "frontend" : agent.id === "db" ? "database" : agent.id === "test" ? "testing" : agent.id === "rev" ? "reviewer" : agent.id];
      if (!task) return agent;
      return { ...agent, status: task.status === "running" ? "working" : task.status === "error" ? "error" : task.status === "done" ? "done" : "idle", task: task.description };
    }));
    const workspace = await api(`/projects/${projectId}/files`, { token });
    setFiles(workspace.files);
  };

  useEffect(() => {
    if (!token || !project?.id) return undefined;
    const socket = io(API_URL.replace(/\/api$/, ""), { auth: { token } });
    socket.on("connect", () => socket.emit("join_project", project.id));
    const update = () => refreshProject(project.id).catch(() => {});
    socket.on("task_started", update);
    socket.on("task_completed", update);
    socket.on("task_failed", update);
    socket.on("integration_complete", update);
    return () => socket.disconnect();
  }, [token, project?.id]);

  const login = async (email, password, name, registering) => {
    setError("");
    if (registering && password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setAuthBusy(true);
    try {
      const result = await api(registering ? "/auth/register" : "/auth/login", { method: "POST", body: registering ? { email, password, name } : { email, password } });
      localStorage.setItem("loom_access_token", result.accessToken);
      setToken(result.accessToken);
    } catch (err) { setError(err.message); }
    finally { setAuthBusy(false); }
  };

  const launch = async ({ name, spec }) => {
    setBusy(true); setError("");
    try {
      const planned = await api("/projects", { token, method: "POST", body: { name, spec, provider: "free" } });
      setProject(planned.project);
      setView("dashboard");
      const result = await api(`/projects/${planned.project.id}/run`, { token, method: "POST", body: { provider: "free" } });
      setProject(result.project);
      await refreshProject(planned.project.id);
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem("loom_access_token");
        setToken("");
        setError("Your session expired. Please sign in again.");
      } else {
        setError(err.message);
        setView("new");
      }
    }
    finally { setBusy(false); }
  };

  const saveGroqKey = async (apiKey) => {
    setSettingsBusy(true);
    try {
      const result = await api("/settings/groq-key", { token, method: "PUT", body: { apiKey } });
      setGroqSettings({ configured: result.groqConfigured, model: result.groqModel });
    } finally { setSettingsBusy(false); }
  };

  const saveProviderPreference = async (agentName, provider) => {
    await api(`/agents/${agentName}/preference`, { token, method: "PUT", body: { provider } });
  };

  if (!token) return (
    <div style={{ position: "relative", minHeight: 640 }}>
      <GlobalStyle />
      <Login onLogin={login} error={error} busy={authBusy} />
    </div>
  );

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "providers", label: "Providers", icon: DollarSign },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "new", label: "New project", icon: Rocket },
  ];

  return (
    <div style={{ position: "relative", minHeight: 640, borderRadius: 16, overflow: "hidden" }}>
      <GlobalStyle />
      <Background dense={true} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", minHeight: 640 }}>
        <div style={{ width: 216, padding: 18, ...glass(0.06), borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26, padding: "0 4px" }}>
            <BrandLogo width={112} />
          </div>
          {nav.map(n => <NavItem key={n.id} {...n} active={view === n.id} onClick={() => setView(n.id)} />)}
          <div style={{ marginTop: 26, padding: 13, borderRadius: 11, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Active project</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: T.text }}>{project?.name || "No active project"}</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>
                {view === "dashboard" && "Agent activity"}
                {view === "providers" && "Model providers"}
                {view === "new" && "Start a new build"}
                {view === "settings" && "Settings"}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: T.textSec, marginTop: 3 }}>
                {view === "dashboard" && "A coordinated team working one codebase together"}
                {view === "providers" && "Route each agent to a free or paid model"}
                {view === "new" && "Describe the app — the orchestrator handles the rest"}
              </div>
            </div>
            <IconButton icon={Settings} onClick={() => setView("settings")} />
          </div>

          {error && <div style={{ color: T.error, fontFamily: FONT_BODY, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {view === "dashboard" && <Dashboard agents={agents} project={project} files={files} />}
          {view === "providers" && <Providers agents={agents} setAgents={setAgents} onSave={saveProviderPreference} />}
          {view === "settings" && <SettingsPanel configured={groqSettings.configured} model={groqSettings.model} onSave={saveGroqKey} busy={settingsBusy} />}
          {view === "new" && <NewProject onLaunch={launch} busy={busy} />}
        </div>
      </div>
    </div>
  );
}
