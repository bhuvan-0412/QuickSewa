"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LangToggle from "../components/LangToggle";
import { useLang } from "../lib/language";
import { supabase } from "../lib/supabase";

const STATUS_COLOR = { open: "#dc2626", "in-progress": "#d97706", resolved: "#16a34a" };
const _SEVERITY_COLOR = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
const CATEGORY_EMOJI = {
  Pothole: "🕳️",
  Garbage: "🗑️",
  Streetlight: "💡",
  Waterlogging: "💧",
  Encroachment: "🚧",
  Other: "📌",
};

export default function Dashboard() {
  const { t } = useLang();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);

  const statusLabel = {
    open: t.open,
    "in-progress": t.inProgress,
    resolved: t.resolved,
  };

  function login() {
    if (password === "officer123") setAuthed(true);
    else alert("Wrong password");
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from("complaints").select("*");
      if (fetchError) throw fetchError;

      // Sort automatically: urgent DESC, upvotes DESC
      const sorted = (data || []).sort((a, b) => {
        const aUrgent = a.urgent === true || a.urgent === "true" ? 1 : 0;
        const bUrgent = b.urgent === true || b.urgent === "true" ? 1 : 0;
        if (aUrgent !== bUrgent) {
          return bUrgent - aUrgent;
        }
        return (b.upvotes || 0) - (a.upvotes || 0);
      });

      setComplaints(sorted);
    } catch (err) {
      console.error("Dashboard failed to fetch complaints:", err);
      setError("Failed to load complaints from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchAll();
  }, [authed, fetchAll]);

  async function updateStatus(id, status) {
    try {
      const { error: updateError } = await supabase
        .from("complaints")
        .update({ status })
        .eq("id", id);
      if (updateError) throw updateError;
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch (err) {
      console.error("Dashboard failed to update status:", err);
      alert("Failed to update status. Please try again.");
    }
  }

  function timeAgo(dateStr) {
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    if (hrs < 1) return t.justNow;
    if (hrs < 24) return `${hrs} ${t.hoursAgo}`;
    return `${Math.floor(hrs / 24)} ${t.daysAgo}`;
  }

  function slaLabel(dateStr, status) {
    if (status === "resolved") return { text: t.resolved, color: "#16a34a" };
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    const remaining = 72 - hrs;
    if (remaining < 0)
      return { text: `${Math.abs(remaining)} ${t.hoursOverdue}`, color: "#dc2626" };
    return null;
  }

  const filtered =
    filterStatus === "all" ? complaints : complaints.filter((c) => c.status === filterStatus);

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  if (!authed) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="bg-blob bg-blob-green" />
        <div className="bg-blob bg-blob-teal" />
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 100,
          }}
        >
          <LangToggle />
        </div>

        <div
          className="animated-card glass-panel"
          style={{
            borderRadius: "var(--radius-lg)",
            padding: "3rem 2.5rem",
            maxWidth: 400,
            width: "100%",
            border: "1px solid rgba(22, 163, 74, 0.22)",
            textAlign: "center",
            boxShadow: "var(--shadow-lg)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(22, 163, 74, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: 36,
              boxShadow: "0 8px 24px rgba(22, 163, 74, 0.12)",
              color: "var(--primary)",
              border: "2px solid var(--primary-border)",
            }}
          >
            🏛️
          </div>
          <h1
            className="gradient-title"
            style={{
              fontSize: 26,
              fontWeight: 800,
              marginBottom: 6,
              letterSpacing: "-0.5px",
            }}
          >
            {t.officerLogin}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: "2rem",
              fontWeight: 500,
            }}
          >
            {t.officerDashboard}
          </p>
          <input
            type="password"
            placeholder={t.enterPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            className="input-aesthetic"
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              fontSize: 15,
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={login}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "0.9rem",
              borderRadius: 14,
              fontSize: 16,
              minHeight: "52px",
            }}
          >
            {t.loginBtn}
          </button>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: "1.5rem",
              fontWeight: 600,
            }}
          >
            {t.demoPassword}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        paddingBottom: "5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="bg-blob bg-blob-green" />
      <div className="bg-blob bg-blob-teal" />
      {/* Dashboard Header bar */}
      <div
        className="glass-panel"
        style={{
          borderBottom: "1px solid rgba(22, 163, 74, 0.15)",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/"
            className="btn-secondary"
            style={{
              borderRadius: 10,
              width: 40,
              height: 40,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            ←
          </Link>
          <div>
            <h1
              className="gradient-title"
              style={{
                fontSize: 18,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              {t.dashboardTitle}
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
              {t.dashboardSub}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={fetchAll}
            className="btn-secondary"
            style={{
              padding: "0 1rem",
              borderRadius: 12,
              fontSize: 13,
              minHeight: "40px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t.refresh}
          </button>
          <LangToggle />
        </div>
      </div>

      {/* Dashboard stats cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 16,
          padding: "2rem 1.5rem 1.25rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        {[
          { label: t.total, value: stats.total, color: "#374151", icon: "📊" },
          { label: t.open, value: stats.open, color: "#dc2626", icon: "🔴" },
          { label: t.inProgress, value: stats.inProgress, color: "#d97706", icon: "⏳" },
          { label: t.resolved, value: stats.resolved, color: "#16a34a", icon: "✅" },
        ].map((s) => (
          <div
            key={s.label}
            className="hover-lift"
            style={{
              background: "white",
              borderRadius: 20,
              padding: "1.25rem 1rem",
              border: "1px solid #f1f5f9",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>{s.icon}</span>
            <p style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 4,
                margin: "4px 0 0 0",
                fontWeight: 600,
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Dashboard filter selector buttons bar */}
      <div
        className="filter-toolbar"
        style={{
          padding: "0 1.5rem",
          marginBottom: "1.5rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        {["all", "open", "in-progress", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`filter-btn ${filterStatus === s ? "active" : ""}`}
            style={{
              minHeight: "36px",
              cursor: "pointer",
            }}
          >
            {s === "all"
              ? t.filterAll
              : s === "open"
                ? t.open
                : s === "in-progress"
                  ? t.inProgress
                  : t.resolved}
          </button>
        ))}
      </div>

      {/* Dashboard grievance report cards list */}
      <div
        style={{
          padding: "0 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative",
          zIndex: 10,
        }}
      >
        {error ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 16,
              padding: "1.25rem",
              color: "#dc2626",
              textAlign: "center",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ⚠️ {error}
          </div>
        ) : loading ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: "3rem",
              fontWeight: 600,
            }}
          >
            {t.loading}
          </p>
        ) : filtered.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: "3rem",
              fontWeight: 600,
            }}
          >
            {t.noComplaints}
          </p>
        ) : (
          filtered.map((c) => {
            const sla = slaLabel(c.created_at, c.status);
            return (
              <div
                key={c.id}
                className="animated-card hover-lift"
                style={{
                  background: "white",
                  borderRadius: 20,
                  border: "1px solid #f1f5f9",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 0 }}>
                  {c.photo_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={c.photo_url}
                      alt=""
                      style={{ width: 120, height: 120, objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <div style={{ padding: "1.25rem", flex: 1, minWidth: 260 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{CATEGORY_EMOJI[c.category] || "📌"}</span>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>
                        {t.categories[c.category] || c.category}
                      </span>

                      {/* RED URGENT Badges */}
                      {(c.urgent === true || c.urgent === "true") && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontWeight: 800,
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                          }}
                        >
                          🚨 URGENT
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontWeight: 700,
                          background: `${STATUS_COLOR[c.status]}15`,
                          color: STATUS_COLOR[c.status],
                          border: `1px solid ${STATUS_COLOR[c.status]}30`,
                        }}
                      >
                        {statusLabel[c.status]}
                      </span>

                      {/* confidence score tag */}
                      {c.confidence !== undefined && c.confidence !== null && c.confidence > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontWeight: 700,
                            background: "var(--primary-light)",
                            color: "var(--primary)",
                            border: "1px solid var(--primary-border)",
                          }}
                        >
                          🤖 {c.confidence}% Match
                        </span>
                      )}

                      {/* department tag */}
                      {c.department && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontWeight: 700,
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          🏢 {c.department}
                        </span>
                      )}

                      {/* estimated repair cost */}
                      {c.estimated_repair && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontWeight: 700,
                            background: "#f8fafc",
                            color: "#475569",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          🛠️ {c.estimated_repair}
                        </span>
                      )}
                    </div>

                    {c.title && (
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#111827",
                          margin: "4px 0 6px 0",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {c.title}
                      </h3>
                    )}

                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8, fontWeight: 500 }}>
                      📍 {c.ward} · {timeAgo(c.created_at)} · 👍 {c.upvotes}
                    </p>
                    {c.description && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#374151",
                          marginBottom: 10,
                          lineHeight: 1.5,
                        }}
                      >
                        {c.description}
                      </p>
                    )}
                    {sla && (
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: sla.color,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        ⏱️ {sla.text}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem 1.25rem",
                    borderTop: "1px solid #f1f5f9",
                    background: "#f8fafc",
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {c.status !== "in-progress" && c.status !== "resolved" && (
                    <button
                      onClick={() => updateStatus(c.id, "in-progress")}
                      style={{
                        padding: "0.5rem 1.25rem",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        background: "#fffbeb",
                        color: "#d97706",
                        border: "1px solid #fde68a",
                        minHeight: "40px",
                        cursor: "pointer",
                      }}
                    >
                      {t.markInProgress}
                    </button>
                  )}
                  {c.status !== "resolved" && (
                    <button
                      onClick={() => updateStatus(c.id, "resolved")}
                      style={{
                        padding: "0.5rem 1.25rem",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        background: "#f0fdf4",
                        color: "#16a34a",
                        border: "1px solid #bbf7d0",
                        minHeight: "40px",
                        cursor: "pointer",
                      }}
                    >
                      {t.markResolved}
                    </button>
                  )}
                  {c.status === "resolved" && (
                    <span
                      style={{
                        fontSize: 13,
                        color: "#16a34a",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {t.issueResolved}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
