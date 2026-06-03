"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import LangToggle from "../components/LangToggle";
import { useLang } from "../lib/language";
import { supabase } from "../lib/supabase";

const STATUS_COLOR = { open: "#dc2626", "in-progress": "#d97706", resolved: "#16a34a" };
const CATEGORY_EMOJI = {
  Pothole: "🕳️",
  Garbage: "🗑️",
  Streetlight: "💡",
  Waterlogging: "💧",
  Encroachment: "🚧",
  Other: "📌",
};

export default function MapPage() {
  const { t } = useLang();
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const statusLabel = {
    open: t.open,
    "in-progress": t.inProgress,
    resolved: t.resolved,
  };

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setComplaints(data || []);
    } catch (err) {
      console.error("Failed to fetch complaints for map:", err);
      setError("Could not fetch live complaints. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Fetch complaints on mount
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // 2. Client-side dynamic injection of Leaflet
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Inject CSS if not already present
    if (!document.getElementById("leaflet-css-link")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-link";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Inject JS if not already present
    if (!window.L) {
      const script = document.createElement("script");
      script.id = "leaflet-js-script";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  async function upvote(id) {
    if (upvoting) return;
    setUpvoting(true);
    try {
      const complaint = complaints.find((c) => c.id === id);
      if (!complaint) return;
      const updatedCount = (complaint.upvotes || 0) + 1;

      const { error: updateError } = await supabase
        .from("complaints")
        .update({ upvotes: updatedCount })
        .eq("id", id);

      if (updateError) throw updateError;

      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, upvotes: updatedCount } : c)));

      if (selected && selected.id === id) {
        setSelected((prev) => ({ ...prev, upvotes: updatedCount }));
      }
    } catch (err) {
      console.error("Failed to register upvote on map:", err);
      alert("Failed to register upvote. Please try again.");
    } finally {
      setUpvoting(false);
    }
  }

  // Categories to show in the filter toolbar: All, Pothole, Garbage, Streetlight, Waterlogging
  const categories = ["All", "Pothole", "Garbage", "Streetlight", "Waterlogging"];
  const filtered = useMemo(() => {
    return filter === "All" ? complaints : complaints.filter((c) => c.category === filter);
  }, [complaints, filter]);

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return t.justNow;
    if (hrs < 24) return `${hrs} ${t.hoursAgo}`;
    return `${Math.floor(hrs / 24)} ${t.daysAgo}`;
  }

  function getSlaHours(dateStr, status) {
    if (status === "resolved") return null;
    const hrs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    return 72 - hrs;
  }

  // 3. Initialize/Update Leaflet map on loaded state, complaints or filter changes
  useEffect(() => {
    if (!leafletLoaded) return;
    if (typeof window === "undefined") return;
    const L = window.L;
    if (!L) return;

    // Clear existing map instance
    if (window._map) {
      try {
        window._map.remove();
      } catch (e) {
        console.warn("Failed to remove previous map instance:", e);
      }
      window._map = null;
    }

    // Reset container ID to prevent "Map container is already initialized" error
    const container = document.getElementById("leaflet-map");
    if (container) {
      container._leaflet_id = null;
    }

    // Initialize map centered on Hyderabad at [17.3850, 78.4867] with zoom level 12
    let map;
    try {
      map = L.map("leaflet-map").setView([17.385, 78.4867], 12);
      window._map = map;
    } catch (e) {
      console.error("Failed to initialize map:", e);
      return;
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Render custom status-colored emoji markers
    filtered.forEach((complaint) => {
      const lat = parseFloat(complaint.latitude);
      const lng = parseFloat(complaint.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        console.warn("Skipping marker placement for invalid coordinates:", complaint);
        return;
      }

      const color = STATUS_COLOR[complaint.status] || "#dc2626";
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${color};border:3px solid white;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer
        ">${CATEGORY_EMOJI[complaint.category] || "📌"}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lng], { icon });
      marker.on("click", () => setSelected(complaint));
      marker.addTo(map);
    });

    return () => {
      if (window._map) {
        try {
          window._map.remove();
        } catch (e) {
          console.warn("Clean-up: failed to remove map:", e);
        }
        window._map = null;
      }
    };
  }, [leafletLoaded, filtered]);

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fafc",
        overflow: "hidden",
      }}
    >
      {/* Map Header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/"
            style={{
              fontSize: 20,
              color: "#374151",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              minHeight: "48px",
              padding: "0 8px",
            }}
          >
            ←
          </Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#14532d", margin: 0 }}>
            {t.mapTitle}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "#f0fdf4",
              padding: "6px 14px",
              borderRadius: 99,
              fontSize: 13,
              color: "#15803d",
              fontWeight: 600,
            }}
          >
            {filtered.length} {t.issues}
          </div>
          <LangToggle />
        </div>
      </div>

      {/* Filter toolbar */}
      <div
        style={{
          padding: "0.75rem 1rem",
          background: "white",
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          zIndex: 100,
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: filter === cat ? "2px solid #16a34a" : "1px solid #e5e7eb",
              background: filter === cat ? "#f0fdf4" : "white",
              color: filter === cat ? "#15803d" : "#6b7280",
              minHeight: "48px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {CATEGORY_EMOJI[cat] || ""} {cat === "All" ? t.filterAll : t.categories[cat] || cat}
          </button>
        ))}
      </div>

      {/* Live Error Notification */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            borderBottom: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            zIndex: 100,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={fetchComplaints}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Map Content Container */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* Leaflet map div */}
        <div id="leaflet-map" style={{ width: "100%", height: "100%", zIndex: 10 }} />

        {/* Loading overlay if leaflet or data isn't loaded */}
        {(!leafletLoaded || loading) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
            }}
          >
            <div
              style={{
                textAlign: "center",
                background: "white",
                padding: "1.5rem 2.5rem",
                borderRadius: 16,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>🗺️</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#374151" }}>
                Loading Hyderabad Live Map...
              </p>
            </div>
          </div>
        )}

        {/* Visual Legend (Bottom Left) */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            background: "white",
            borderRadius: 12,
            padding: "0.6rem 1rem",
            border: "1px solid #e5e7eb",
            display: "flex",
            gap: 12,
            zIndex: 1000,
            flexWrap: "wrap",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 600 }}>
                {statusLabel[status]}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Sheet Card Details */}
        {selected && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "white",
              borderRadius: "24px 24px 0 0",
              padding: "1.5rem",
              zIndex: 1000,
              borderTop: "1px solid #e5e7eb",
              boxShadow: "0 -10px 25px -5px rgba(0,0,0,0.1)",
              maxHeight: "55%",
              overflowY: "auto",
            }}
          >
            {/* Header / Dismiss row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{CATEGORY_EMOJI[selected.category]}</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: "#111827" }}>
                    {t.categories[selected.category] || selected.category}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 99,
                      fontWeight: 700,
                      background: `${STATUS_COLOR[selected.status]}15`,
                      color: STATUS_COLOR[selected.status],
                      border: `1px solid ${STATUS_COLOR[selected.status]}40`,
                    }}
                  >
                    {statusLabel[selected.status]}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  📍 {selected.ward} · {timeAgo(selected.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  fontSize: 16,
                  color: "#6b7280",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Optional Title */}
            {selected.title && (
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", margin: "0 0 10px 0" }}>
                {selected.title}
              </h3>
            )}

            {/* Photo Proof */}
            {selected.photo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selected.photo_url}
                alt="Complaint details"
                style={{
                  width: "100%",
                  borderRadius: 16,
                  maxHeight: 180,
                  objectFit: "cover",
                  marginBottom: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            )}

            {/* Optional description */}
            {selected.description && (
              <p
                style={{
                  fontSize: 14,
                  color: "#4b5563",
                  marginBottom: 14,
                  lineHeight: 1.5,
                  background: "#f9fafb",
                  padding: "10px 14px",
                  borderRadius: 8,
                  borderLeft: "3px solid #16a34a",
                  margin: "0 0 14px 0",
                }}
              >
                {selected.description}
              </p>
            )}

            {/* SLA Countdown Display & Actions Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #f3f4f6",
                paddingTop: 14,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                {(() => {
                  const sla = getSlaHours(selected.created_at, selected.status);
                  if (sla === null)
                    return (
                      <span
                        style={{
                          fontSize: 13,
                          color: "#16a34a",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        ✅ {t.resolved}
                      </span>
                    );
                  if (sla < 0)
                    return (
                      <span
                        style={{
                          fontSize: 13,
                          color: "#dc2626",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        🚨 {t.escalated} · {Math.abs(sla)} {t.hoursOverdue}
                      </span>
                    );
                  return null;
                })()}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => upvote(selected.id)}
                  disabled={upvoting}
                  style={{
                    background: "#f0fdf4",
                    color: "#15803d",
                    padding: "0 1rem",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    border: "1px solid #bbf7d0",
                    minHeight: "48px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  👍 {selected.upvotes || 0} {t.sameIssue}
                </button>
                <Link
                  href={`/report/${selected.id}`}
                  style={{
                    background: "#16a34a",
                    color: "white",
                    padding: "0 1.25rem",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    minHeight: "48px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  📄 {t.viewReport}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
