"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LangToggle from "../../components/LangToggle";
import { useLang } from "../../lib/language";
import { supabase } from "../../lib/supabase";

const STATUS_COLOR = { open: "#dc2626", "in-progress": "#d97706", resolved: "#16a34a" };
const STATUS_BG = { open: "#fef2f2", "in-progress": "#fffbeb", resolved: "#f0fdf4" };
const _SEVERITY_COLOR = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
const CATEGORY_EMOJI = {
  Pothole: "🕳️",
  Garbage: "🗑️",
  Streetlight: "💡",
  Waterlogging: "💧",
  Encroachment: "🚧",
  Other: "📌",
};

export default function ComplaintReport() {
  const { t, lang } = useLang();
  const params = useParams();
  const id = params.id;

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const statusLabel = {
    open: t.open,
    "in-progress": t.inProgress,
    resolved: t.resolved,
  };

  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("complaints")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;
      setComplaint(data);
    } catch (err) {
      console.error("Failed to load complaint report:", err);
      setError(t.detailsNotLoaded);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (id) {
      fetchComplaint();
    }
  }, [id, fetchComplaint]);

  async function handleUpvote() {
    if (!complaint || upvoting) return;
    setUpvoting(true);
    try {
      const updatedUpvotes = (complaint.upvotes || 0) + 1;
      const { error: updateError } = await supabase
        .from("complaints")
        .update({ upvotes: updatedUpvotes })
        .eq("id", complaint.id);
      if (updateError) throw updateError;
      setComplaint((prev) => ({ ...prev, upvotes: updatedUpvotes }));
    } catch (err) {
      console.error("Failed to register upvote:", err);
      alert("Could not update upvotes. Please try again.");
    } finally {
      setUpvoting(false);
    }
  }

  async function handleShare() {
    if (typeof window === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard write failed:", err);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthsTe = [
        "జనవరి",
        "ఫిబ్రవరి",
        "మార్చి",
        "ఏప్రిల్",
        "మే",
        "జూన్",
        "జూలై",
        "ఆగస్టు",
        "సెప్టెంబరు",
        "అక్టోబరు",
        "నవంబరు",
        "డిసెంబరు",
      ];
      const month = lang === "te" ? monthsTe[date.getMonth()] : months[date.getMonth()];
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
    } catch (_e) {
      return dateStr;
    }
  }

  function getSlaStatus(dateStr, status) {
    if (status === "resolved") {
      return { text: t.slaClosed, color: "#16a34a", bg: "#f0fdf4" };
    }
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    const remaining = 72 - hrs;
    if (remaining < 0) {
      return {
        text: `🚨 ${t.slaOverdue} ${Math.abs(remaining)}${t.escalatedSupervisor}`,
        color: "#dc2626",
        bg: "#fef2f2",
      };
    }
    return null;
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <p style={{ fontSize: 16, color: "#6b7280" }}>{t.loadingReport}</p>
      </main>
    );
  }

  if (error || !complaint) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "2rem",
            maxWidth: 440,
            width: "100%",
            border: "1px solid #fca5a5",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#b91c1c", marginBottom: 12 }}>
            {t.reportNotFound}
          </h2>
          <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {error || t.detailsNotLoaded}
          </p>
          <Link
            href="/map"
            style={{
              background: "#16a34a",
              color: "white",
              padding: "0.8rem",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              minHeight: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {t.goLiveMap}
          </Link>
        </div>
      </main>
    );
  }

  const shortId = complaint.id.slice(0, 8).toUpperCase();
  const sla = getSlaStatus(complaint.created_at, complaint.status);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f0fdf4",
        padding: "2rem 1rem",
        paddingBottom: "4rem",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `,
        }}
      />

      {/* Control row */}
      <div
        className="no-print"
        style={{
          maxWidth: 680,
          margin: "0 auto 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link
          href="/map"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#166534",
            fontWeight: 600,
            textDecoration: "none",
            fontSize: 15,
            padding: "8px 16px",
            background: "white",
            borderRadius: 10,
            border: "1px solid #bbf7d0",
            minHeight: "48px",
          }}
        >
          {t.backLiveMap}
        </Link>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleShare}
            style={{
              background: "white",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
              minHeight: "48px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🔗 {copied ? t.copiedUrl : t.shareUrl}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              background: "#16a34a",
              border: "none",
              color: "white",
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
              minHeight: "48px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🖨️ {t.printDoc}
          </button>
          <LangToggle />
        </div>
      </div>

      {/* Main printable sheet */}
      <div
        className="print-card"
        style={{
          maxWidth: 680,
          margin: "0 auto",
          background: "white",
          border: "1px solid #bbf7d0",
          borderRadius: 24,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
          padding: "2.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative Green Top Border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#16a34a",
          }}
        />

        {/* Document Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #f0fdf4",
            paddingBottom: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 24 }}>📍</span>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#14532d",
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                {t.appName}
              </h1>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#166534",
                fontWeight: 600,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {t.ghmcHeader}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 4,
              }}
            >
              {t.grievanceId}
            </span>
            <span
              style={{
                display: "inline-block",
                background: "#f3f4f6",
                color: "#1f2937",
                fontWeight: 800,
                fontSize: 15,
                padding: "4px 10px",
                borderRadius: 8,
                fontFamily: "monospace",
              }}
            >
              #{shortId}
            </span>
          </div>
        </div>

        {/* SLA Status Bar & RED urgent badge */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "2rem" }}>
          {complaint.urgent && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>🚨</span>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#dc2626", margin: 0 }}>
                {t.criticalEmergency}
              </p>
            </div>
          )}

          {sla && (
            <div
              style={{
                background: sla.bg,
                border: `1px solid ${sla.color}33`,
                borderRadius: 12,
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, color: sla.color, margin: 0 }}>
                {sla.text}
              </p>
            </div>
          )}
        </div>

        {/* Complaint Body Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {complaint.title && (
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#111827",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {complaint.title}
              </h2>
            </div>
          )}

          {/* Grid Layout of parameters */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.25rem",
              background: "#f9fafb",
              padding: "1.25rem",
              borderRadius: 16,
              border: "1px solid #f3f4f6",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                {t.categoryLabel}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {CATEGORY_EMOJI[complaint.category] || "📌"}{" "}
                {t.categories[complaint.category] || complaint.category}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                {t.statusLabel}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 99,
                  fontWeight: 700,
                  background: STATUS_BG[complaint.status] || "#f3f4f6",
                  color: STATUS_COLOR[complaint.status] || "#6b7280",
                  border: `1px solid ${STATUS_COLOR[complaint.status]}30`,
                }}
              >
                ● {statusLabel[complaint.status]}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                {t.wardLocation}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                📍 {complaint.ward}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                {t.filedOn}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                🕒 {formatDate(complaint.created_at)}
              </span>
            </div>

            {/* Department tag */}
            {complaint.department && (
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {t.ghmcDept}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#166534" }}>
                  🏢 {complaint.department}
                </span>
              </div>
            )}

            {/* Estimated Repair Cost */}
            {complaint.estimated_repair && (
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {t.estimatedRepairCost}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                  🛠️ {complaint.estimated_repair}
                </span>
              </div>
            )}
          </div>

          {/* AI Confidence gauge card */}
          {complaint.confidence !== undefined &&
            complaint.confidence !== null &&
            complaint.confidence > 0 && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #d1fae5",
                  padding: "1rem",
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#166534",
                    marginBottom: 6,
                  }}
                >
                  <span>{t.aiConfidenceGauge}</span>
                  <span>
                    {complaint.confidence}% {t.accurateMatch}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 8,
                    background: "#e2e8f0",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${complaint.confidence}%`,
                      background:
                        complaint.confidence >= 80
                          ? "#16a34a"
                          : complaint.confidence >= 60
                            ? "#d97706"
                            : "#dc2626",
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            )}

          {/* Description */}
          {complaint.description && (
            <div>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                {t.descriptionLabel}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "#374151",
                  lineHeight: 1.6,
                  margin: 0,
                  padding: "1rem",
                  background: "#f8fafc",
                  borderRadius: 12,
                  borderLeft: "4px solid #16a34a",
                }}
              >
                {complaint.description}
              </p>
            </div>
          )}

          {/* Secondary Observations array pills */}
          {(() => {
            if (!complaint.secondary_issues) return null;
            try {
              const parsed =
                typeof complaint.secondary_issues === "string"
                  ? JSON.parse(complaint.secondary_issues)
                  : complaint.secondary_issues;
              if (!Array.isArray(parsed) || parsed.length === 0) return null;
              return (
                <div>
                  <h3
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                    }}
                  >
                    {t.secondaryObservations}
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {parsed.map((issue) => (
                      <span
                        key={issue}
                        style={{
                          background: "#f3f4f6",
                          color: "#4b5563",
                          padding: "4px 12px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              );
            } catch (_e) {
              return null;
            }
          })()}

          {/* Photo evidence */}
          {complaint.photo_url && (
            <div>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                }}
              >
                {t.photoEvidence}
              </h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={complaint.photo_url}
                alt="Civic Issue Evidence"
                style={{
                  width: "100%",
                  borderRadius: 16,
                  maxHeight: 400,
                  objectFit: "cover",
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          )}

          {/* Technical metadata */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #f3f4f6",
              paddingTop: "1.5rem",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              <strong>{t.gpsCoords}:</strong> {complaint.latitude?.toFixed(6)},{" "}
              {complaint.longitude?.toFixed(6)}
            </div>

            <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{t.affectingAreaToo}</span>
              <button
                onClick={handleUpvote}
                disabled={upvoting}
                style={{
                  background: "#f0fdf4",
                  color: "#15803d",
                  padding: "0.6rem 1.2rem",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  border: "1px solid #bbf7d0",
                  cursor: "pointer",
                  minHeight: "48px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                👍 {complaint.upvotes || 0} {t.sameIssue}
              </button>
            </div>

            <div className="print-only" style={{ display: "none", fontSize: 12, color: "#6b7280" }}>
              <strong>Community Support:</strong> {complaint.upvotes || 0} upvotes
            </div>
          </div>
        </div>

        {/* Footer of Printable Page */}
        <div
          style={{
            marginTop: "3rem",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          <span>{t.portalFooter}</span>
          <span>{t.deskFooter}</span>
        </div>
      </div>
    </main>
  );
}
