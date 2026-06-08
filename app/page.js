"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import LangToggle from "./components/LangToggle";
import { useLang } from "./lib/language";
import { supabase } from "./lib/supabase";

export default function Home() {
  const { t } = useLang();
  const [count, setCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [wardsCount, setWardsCount] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function getStats() {
      setError(false);
      try {
        const { count: total, error: err1 } = await supabase
          .from("complaints")
          .select("*", { count: "exact", head: true });
        if (err1) throw err1;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: resolved, error: err2 } = await supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("status", "resolved")
          .gte("created_at", oneWeekAgo.toISOString());
        if (err2) throw err2;

        const { data: wardsData, error: err3 } = await supabase.from("complaints").select("ward");
        if (err3) throw err3;

        const uniqueWards = new Set((wardsData || []).map((r) => r.ward).filter(Boolean));

        setCount(total || 0);
        setResolvedCount(resolved || 0);
        setWardsCount(uniqueWards.size || 0);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setError(true);
      }
    }
    getStats();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decorative Blur Blobs */}
      <div className="bg-blob bg-blob-green" />
      <div className="bg-blob bg-blob-teal" />

      {/* Top-right language selector */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
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
          width: "100%",
          maxWidth: "480px",
          border: "1px solid rgba(22, 163, 74, 0.22)",
          textAlign: "center",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Soft green GHMC badge */}
        <div className="badge-premium" style={{ marginBottom: "1.5rem" }}>
          <span>🛡️</span> GHMC HYDERABAD
        </div>

        {/* Brand Icon Badge */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: 36,
            boxShadow: "0 8px 24px rgba(22, 163, 74, 0.35)",
            color: "white",
            border: "4px solid rgba(255, 255, 255, 0.8)",
          }}
        >
          📍
        </div>

        <h1
          className="gradient-title"
          style={{
            fontSize: "42px",
            fontWeight: 800,
            marginBottom: 10,
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
          }}
        >
          {t.appName}
        </h1>

        <p
          className="telugu-text"
          style={{
            fontSize: "18px",
            color: "#166534",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {t.tagline}
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            marginBottom: "2.5rem",
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          {t.taglineSub}
        </p>

        {/* Animated stat cards */}
        {error ? (
          <div
            style={{
              background: "#fff5f5",
              borderRadius: 18,
              padding: "1.25rem",
              marginBottom: "2.5rem",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>
              ⚠️ {t.unableToLoad}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: "2.5rem",
            }}
          >
            {/* Stat Item 1 */}
            <div
              className="hover-lift"
              style={{
                background: "white",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem 0.5rem",
                border: "1px solid #f1f5f9",
                boxShadow: "var(--shadow-sm)",
                textAlign: "center",
                cursor: "default",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>📋</div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--primary)",
                  lineHeight: 1,
                  marginBottom: 6,
                  letterSpacing: "-0.5px",
                }}
              >
                {count.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  whiteSpace: "pre-line",
                  textTransform: "uppercase",
                  letterSpacing: "0.2px",
                }}
              >
                {t.issuesReported}
              </div>
            </div>

            {/* Stat Item 2 */}
            <div
              className="hover-lift"
              style={{
                background: "white",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem 0.5rem",
                border: "1px solid #f1f5f9",
                boxShadow: "var(--shadow-sm)",
                textAlign: "center",
                cursor: "default",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>✅</div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--primary)",
                  lineHeight: 1,
                  marginBottom: 6,
                  letterSpacing: "-0.5px",
                }}
              >
                {resolvedCount.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  whiteSpace: "pre-line",
                  textTransform: "uppercase",
                  letterSpacing: "0.2px",
                }}
              >
                {t.resolvedWeek}
              </div>
            </div>

            {/* Stat Item 3 */}
            <div
              className="hover-lift"
              style={{
                background: "white",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem 0.5rem",
                border: "1px solid #f1f5f9",
                boxShadow: "var(--shadow-sm)",
                textAlign: "center",
                cursor: "default",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>🗺️</div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "var(--primary)",
                  lineHeight: 1,
                  marginBottom: 6,
                  letterSpacing: "-0.5px",
                }}
              >
                {wardsCount.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  whiteSpace: "pre-line",
                  textTransform: "uppercase",
                  letterSpacing: "0.2px",
                }}
              >
                {t.wardsCovered}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 14,
            padding: "0.875rem 1rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 28 }}>🌧️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0369a1", margin: 0 }}>
              Monsoon Watch is live
            </p>
            <p style={{ fontSize: 12, color: "#0284c7", margin: 0 }}>
              Report flooded roads and waterlogging in real time
            </p>
          </div>
          <Link
            href="/flood"
            style={{
              background: "#0369a1",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Open →
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Link
            href="/report"
            className="btn-primary"
            style={{
              padding: "1rem 2rem",
              borderRadius: "16px",
              fontSize: "16px",
              minHeight: "54px",
              textDecoration: "none",
            }}
          >
            {t.reportBtn}
          </Link>

          <Link
            href="/flood"
            style={{
              display: "block",
              background: "#0369a1",
              color: "white",
              padding: "0.9rem 2rem",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            🌧️ Monsoon Flood Map
          </Link>

          <Link
            href="/map"
            className="btn-secondary"
            style={{
              padding: "1rem 2rem",
              borderRadius: "16px",
              fontSize: "15px",
              minHeight: "54px",
              textDecoration: "none",
            }}
          >
            {t.mapBtn}
          </Link>

          <Link
            href="/dashboard"
            className="btn-flat"
            style={{
              padding: "0.8rem 2rem",
              borderRadius: "14px",
              fontSize: "13px",
              minHeight: "44px",
              textDecoration: "none",
            }}
          >
            {t.dashboardBtn}
          </Link>
        </div>

        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "3rem",
            fontWeight: 600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}
        >
          {t.footer}
        </p>
      </div>
    </main>
  );
}
