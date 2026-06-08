"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import LangToggle from "../components/LangToggle";
import { useLang } from "../lib/language";
import { supabase } from "../lib/supabase";

// Local translations for multilingual support
const localT = {
  en: {
    title: "🌧️ Monsoon Watch · Hyderabad",
    subtitle: "Report flooded roads, waterlogging & blocked drains in real time",
    pinSpot: "Pin a spot",
    pinSpotSub: "Flooded intersection or drain",
    markRoad: "Mark a road",
    markRoadSub: "Tap start & end of flooded stretch",
    markArea: "Mark an area",
    markAreaSub: "Large flooded zone or underpass",
    helperText: "Select a tool above, then tap on the Hyderabad map to place your report.",
    issueTypeLabel: "ISSUE TYPE (required)",
    severityLabel: "SEVERITY (required)",
    descLabel: "DESCRIPTION (optional)",
    descPlaceholder: "Any details? Road name, landmark, depth estimate...",
    submitBtn: "🌧️ Report Flood Issue",
    submitting: "Submitting report...",
    successMsg: "✅ Flood report submitted — GHMC notified",
    recentReports: "Recent Live Reports",
    lastUpdated: "Last updated",
    justNow: "Just now",
    minAgo: "min ago",
    minsAgo: "mins ago",
    upvotes: "Upvotes",
    statusActive: "Active",
    statusResolved: "Resolved",
    radiusLabel: "Radius",
    ward: "Ward",
    timeAgo: "ago",
    issueTypes: {
      "🌊 Flooding": "🌊 Flooding — road fully submerged",
      "💧 Waterlogging": "💧 Waterlogging — standing water, passable",
      "🚫 Road blocked": "🚫 Road blocked — debris or barrier",
      "🕳️ Drain overflow": "🕳️ Drain overflow — sewage/drain overflowing",
      "🌉 Underpass flooded": "🌉 Underpass flooded — underpass underwater",
      "⚠️ Landslide risk": "⚠️ Landslide risk — slope erosion visible",
      "🚗 Stranded vehicles": "🚗 Stranded vehicles — cars stuck in water",
    },
    severities: {
      Minor: "🟡 Minor — ankle deep, slow moving",
      Moderate: "🟠 Moderate — knee deep, avoid if possible",
      Severe: "🔴 Severe — waist deep or above, road closed",
    },
  },
  te: {
    title: "🌧️ వర్షాకాల నిఘా · హైదరాబాద్",
    subtitle: "వరద రోడ్లు, నీరు నిల్వ & కాలువల నిరోధాలను నిజ సమయంలో నివేదించండి",
    pinSpot: "స్థలాన్ని పిన్ చేయి",
    pinSpotSub: "వరద ప్రాంతం లేదా కాలువ",
    markRoad: "రోడ్డును గుర్తించు",
    markRoadSub: "వరద రోడ్డు ప్రారంభం & ముగింపును నొక్కండి",
    markArea: "ప్రాంతాన్ని గుర్తించు",
    markAreaSub: "పెద్ద వరద జోన్ లేదా అండర్పాస్",
    helperText: "పైన ఒక సాధనాన్ని ఎంచుకుని, ఆపై నివేదికను ఉంచడానికి హైదరాబాద్ మ్యాప్ పై నొక్కండి.",
    issueTypeLabel: "సమస్య రకం (తప్పనిసరి)",
    severityLabel: "తీవ్రత (తప్పనిసరి)",
    descLabel: "వివరణ (ఐచ్ఛికం)",
    descPlaceholder: "ఏదైనా వివరాలు? రోడ్డు పేరు, ల్యాండ్‌మార్క్, నీటి లోతు అంచనా...",
    submitBtn: "🌧️ వరద సమస్యను నివేదించు",
    submitting: "సమర్పిస్తున్నారు...",
    successMsg: "✅ వరద నివేదిక సమర్పించబడింది — GHMC కి తెలియజేయబడింది",
    recentReports: "ఇటీవలి లైవ్ నివేదికలు",
    lastUpdated: "చివరిగా అప్‌డేట్ చేయబడింది",
    justNow: "ఇప్పుడే",
    minAgo: "నిమిషం క్రితం",
    minsAgo: "నిమిషాల క్రితం",
    upvotes: "అప్‌ఓట్లు",
    statusActive: "క్రియాశీలకంగా ఉంది",
    statusResolved: "పరిష్కరించబడింది",
    radiusLabel: "వ్యాసార్థం",
    ward: "వార్డు",
    timeAgo: "క్రితం",
    issueTypes: {
      "🌊 Flooding": "🌊 వరదలు — రోడ్డు పూర్తిగా మునిగిపోయింది",
      "💧 Waterlogging": "💧 నీటి నిల్వ — నిలిచిన నీరు, ప్రయాణించవచ్చు",
      "🚫 Road blocked": "🚫 రోడ్డు బ్లాక్ చేయబడింది — శిధిలాలు లేదా అడ్డంకి",
      "🕳️ Drain overflow": "🕳️ కాలువ పొంగిపొర్లడం — మురికినీరు పొంగిపొర్లడం",
      "🌉 Underpass flooded": "🌉 అండర్పాస్ మునిగిపోయింది — అండర్పాస్ నీటిలో మునిగింది",
      "⚠️ Landslide risk": "⚠️ కొండచరియలు విరిగిపడే ప్రమాదం — మట్టి కోత కనిపిస్తోంది",
      "🚗 Stranded vehicles": "🚗 చిక్కుకున్న వాహనాలు — వాహనాలు నీటిలో చిక్కుకున్నాయి",
    },
    severities: {
      Minor: "🟡 స్వల్పం — చీలమండ లోతు, నెమ్మదిగా కదలడం",
      Moderate: "🟠 మధ్యస్థం — మోకాలి లోతు, వీలైతే నివారించండి",
      Severe: "🔴 తీవ్రం — నడుము లోతు లేదా అంతకంటే ఎక్కువ, రహదారి మూసివేత",
    },
  },
};

const SEVERITY_COLORS = {
  Minor: { bg: "#fef9c3", text: "#854d0e" },
  Moderate: { bg: "#fed7aa", text: "#9a3412" },
  Severe: { bg: "#fee2e2", text: "#991b1b" },
};

export default function FloodPage() {
  const { lang } = useLang();
  const t = localT[lang] || localT.en;

  const mapContainerRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [floodReports, setFloodReports] = useState([]);
  const [activeTool, setActiveTool] = useState("point"); // 'point' | 'segment' | 'zone'

  // Geolocation & drawing states
  const [previewCoords, setPreviewCoords] = useState(null);
  const [segmentStart, setSegmentStart] = useState(null);
  const [radiusKmState, setRadiusKmState] = useState(0.3); // Default 300m

  // Form states
  const [selectedIssue, setSelectedIssue] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [description, setDescription] = useState("");

  // UX states
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [lastUpdatedTime, setLastUpdatedTime] = useState(new Date());
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(t.justNow);
  const [upvotingId, setUpvotingId] = useState(null);

  // Helper function to calculate Ward based on lat/lng
  function getWard(lat, lng) {
    if (!lat) return "Hyderabad";
    if (lat > 17.47) return "Kukatpally";
    if (lat > 17.44) return "Kondapur";
    if (lat > 17.42) return "Banjara Hills";
    if (lat > 17.4) return "Jubilee Hills";
    if (lat > 17.38) return "Himayatnagar";
    if (lng > 78.51) return "Uppal";
    if (lng > 78.49) return "Secunderabad";
    if (lng < 78.38) return "Gachibowli";
    return "LB Nagar";
  }

  // Time-ago formatting helper
  const formatTimeAgo = useCallback(
    (dateStr) => {
      if (!dateStr) return "";
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return t.justNow;
      if (mins < 60) return `${mins} ${mins === 1 ? t.minAgo : t.minsAgo}`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ${t.timeAgo}`;
      return `${Math.floor(hrs / 24)}d ${t.timeAgo}`;
    },
    [t.justNow, t.minAgo, t.minsAgo, t.timeAgo],
  );

  // Fetch all reports from Supabase
  const fetchFloodReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("flood_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setFloodReports(data || []);
      setLastUpdatedTime(new Date());
    } catch (err) {
      console.error("Failed to fetch flood reports:", err);
    }
  }, []);

  // Update "Last updated" dynamic message
  useEffect(() => {
    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - lastUpdatedTime.getTime()) / 1000);
      if (diffSecs < 60) {
        setTimeSinceUpdate(t.justNow);
      } else {
        const mins = Math.floor(diffSecs / 60);
        setTimeSinceUpdate(`${mins} ${mins === 1 ? t.minAgo : t.minsAgo}`);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [lastUpdatedTime, t.justNow, t.minAgo, t.minsAgo]);

  // Initial fetch and 60s auto-refresh
  useEffect(() => {
    fetchFloodReports();
    const interval = setInterval(fetchFloodReports, 60000);
    return () => clearInterval(interval);
  }, [fetchFloodReports]);

  // Load Leaflet dynamically via CDN
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css-link")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-link";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

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

  // Handle upvoting
  const handleUpvote = useCallback(
    async (reportId) => {
      if (upvotingId) return;
      setUpvotingId(reportId);
      try {
        const report = floodReports.find((r) => r.id === reportId);
        if (!report) return;

        const newUpvotes = (report.upvotes || 0) + 1;

        const { error } = await supabase
          .from("flood_reports")
          .update({ upvotes: newUpvotes })
          .eq("id", reportId);

        if (error) throw error;

        // Update UI immediately without reload
        setFloodReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, upvotes: newUpvotes } : r)),
        );
      } catch (err) {
        console.error("Upvote failed:", err);
      } finally {
        setUpvotingId(null);
      }
    },
    [floodReports, upvotingId],
  );

  // Expose upvote to window so Leaflet popup HTML triggers it
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.upvoteFloodReport = (id) => {
        handleUpvote(id);
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.upvoteFloodReport;
      }
    };
  }, [handleUpvote]);

  // Redraw Map and Layers whenever state changes
  useEffect(() => {
    if (!leafletLoaded) return;
    if (typeof window === "undefined") return;
    const L = window.L;
    if (!L) return;

    if (window._floodMap) {
      try {
        window._floodMap.remove();
      } catch (e) {
        console.warn("Failed to remove previous flood map:", e);
      }
      window._floodMap = null;
    }

    if (mapContainerRef.current) {
      mapContainerRef.current._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([17.385, 78.4867], 12);
    window._floodMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // 1. Draw existing reports
    floodReports.forEach((report) => {
      const coords = report.coordinates;
      if (!coords) return;

      const severityLabel = report.severity || "Medium";
      const statusLabel = report.status || "active";
      const wardLabel = report.ward || "Hyderabad";
      const timeAgoStr = formatTimeAgo(report.created_at);

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; color: #1e293b; padding: 4px; min-width: 170px;">
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            ${report.issue_type}
          </div>
          <div style="margin-bottom: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${
              severityLabel === "Minor"
                ? "#fef9c3"
                : severityLabel === "Moderate"
                  ? "#fed7aa"
                  : "#fee2e2"
            }; color: ${
              severityLabel === "Minor"
                ? "#854d0e"
                : severityLabel === "Moderate"
                  ? "#9a3412"
                  : "#991b1b"
            };">
              ${severityLabel}
            </span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${
              statusLabel === "resolved" ? "#dcfce7" : "#fee2e2"
            }; color: ${statusLabel === "resolved" ? "#166534" : "#991b1b"};">
              ${statusLabel === "resolved" ? "Resolved" : "Active"}
            </span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            📍 ${wardLabel} · ${timeAgoStr}
          </div>
          ${
            report.description
              ? `<div style="font-size: 12px; font-style: italic; background: #f8fafc; padding: 6px; border-radius: 4px; border-left: 2px solid #0369a1; margin-bottom: 8px; max-height: 80px; overflow-y: auto;">${report.description}</div>`
              : ""
          }
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <button onclick="window.upvoteFloodReport('${report.id}')" style="background: #0369a1; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold; min-height: 28px;">
              👍 ${report.upvotes || 0} Upvote
            </button>
          </div>
        </div>
      `;

      if (coords.type === "point") {
        const pointIcon = L.divIcon({
          className: "",
          html: `<div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: #dc2626; border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; cursor: pointer;
          ">🔴</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([coords.lat, coords.lng], { icon: pointIcon }).addTo(map).bindPopup(popupHtml);
      } else if (coords.type === "segment") {
        L.polyline([coords.start, coords.end], {
          color: "#ea580c",
          weight: 6,
          opacity: 0.85,
        })
          .addTo(map)
          .bindPopup(popupHtml);
      } else if (coords.type === "zone") {
        L.circle(coords.center, {
          radius: (coords.radiusKm || 0.3) * 1000,
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.25,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(popupHtml);
      }
    });

    // 2. Draw active preview elements (blue)
    if (previewCoords) {
      if (previewCoords.type === "point") {
        const previewIcon = L.divIcon({
          className: "",
          html: `<div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: #0284c7; border: 2px solid white;
            box-shadow: 0 2px 8px rgba(2,132,199,0.4);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; cursor: pointer;
            animation: pulse-glow-blue 1.5s infinite ease-in-out;
          ">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([previewCoords.lat, previewCoords.lng], { icon: previewIcon }).addTo(map);
      } else if (previewCoords.type === "segment") {
        const greenStartIcon = L.divIcon({
          className: "",
          html: `<div style="
            background: #16a34a; color: white; border: 2px solid white;
            border-radius: 8px; padding: 4px 8px; font-size: 10px; font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;
          ">Start</div>`,
          iconSize: [42, 22],
          iconAnchor: [21, 11],
        });
        const redEndIcon = L.divIcon({
          className: "",
          html: `<div style="
            background: #dc2626; color: white; border: 2px solid white;
            border-radius: 8px; padding: 4px 8px; font-size: 10px; font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;
          ">End</div>`,
          iconSize: [42, 22],
          iconAnchor: [21, 11],
        });

        L.marker([previewCoords.start.lat, previewCoords.start.lng], {
          icon: greenStartIcon,
        }).addTo(map);
        L.marker([previewCoords.end.lat, previewCoords.end.lng], { icon: redEndIcon }).addTo(map);
        L.polyline([previewCoords.start, previewCoords.end], {
          color: "#0284c7",
          weight: 6,
          opacity: 0.85,
          dashArray: "5, 5",
        }).addTo(map);
      } else if (previewCoords.type === "zone") {
        const dragIcon = L.divIcon({
          className: "",
          html: `<div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: #0284c7; border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; cursor: move;
          ">⭕</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const previewCircle = L.circle(previewCoords.center, {
          radius: (previewCoords.radiusKm || 0.3) * 1000,
          color: "#0284c7",
          fillColor: "#0ea5e9",
          fillOpacity: 0.25,
          weight: 2,
        }).addTo(map);

        const centerMarker = L.marker([previewCoords.center.lat, previewCoords.center.lng], {
          icon: dragIcon,
          draggable: true,
        }).addTo(map);

        centerMarker.on("drag", (e) => {
          const latlng = e.target.getLatLng();
          previewCircle.setLatLng(latlng);
        });

        centerMarker.on("dragend", (e) => {
          const latlng = e.target.getLatLng();
          setPreviewCoords((prev) => ({
            ...prev,
            center: { lat: latlng.lat, lng: latlng.lng },
          }));
        });
      }
    } else if (segmentStart) {
      const greenStartIcon = L.divIcon({
        className: "",
        html: `<div style="
          background: #16a34a; color: white; border: 2px solid white;
          border-radius: 8px; padding: 4px 8px; font-size: 10px; font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap;
        ">Start</div>`,
        iconSize: [42, 22],
        iconAnchor: [21, 11],
      });
      L.marker([segmentStart.lat, segmentStart.lng], { icon: greenStartIcon }).addTo(map);
    }

    // 3. Map Tap Event Listener
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (activeTool === "point") {
        setPreviewCoords({ type: "point", lat, lng });
      } else if (activeTool === "segment") {
        if (!segmentStart) {
          setSegmentStart({ lat, lng });
        } else {
          setPreviewCoords({
            type: "segment",
            start: segmentStart,
            end: { lat, lng },
          });
          setSegmentStart(null);
        }
      } else if (activeTool === "zone") {
        setPreviewCoords({
          type: "zone",
          center: { lat, lng },
          radiusKm: radiusKmState,
        });
      }
    });

    return () => {
      if (window._floodMap) {
        try {
          window._floodMap.remove();
        } catch (e) {
          console.warn("Failed cleanup map:", e);
        }
        window._floodMap = null;
      }
    };
  }, [
    leafletLoaded,
    floodReports,
    previewCoords,
    activeTool,
    segmentStart,
    radiusKmState,
    formatTimeAgo,
  ]);

  // Handle Zone radius slider changes
  const handleRadiusSlider = (e) => {
    const val = parseFloat(e.target.value);
    setRadiusKmState(val);
    if (previewCoords && previewCoords.type === "zone") {
      setPreviewCoords((prev) => ({
        ...prev,
        radiusKm: val,
      }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previewCoords || !selectedIssue || !selectedSeverity || submitting) return;

    setSubmitting(true);
    try {
      let wardName = "Hyderabad";
      if (previewCoords.type === "point") {
        wardName = getWard(previewCoords.lat, previewCoords.lng);
      } else if (previewCoords.type === "segment") {
        wardName = getWard(previewCoords.start.lat, previewCoords.start.lng);
      } else if (previewCoords.type === "zone") {
        wardName = getWard(previewCoords.center.lat, previewCoords.center.lng);
      }

      const { error } = await supabase
        .from("flood_reports")
        .insert([
          {
            report_type: previewCoords.type,
            severity: selectedSeverity,
            issue_type: selectedIssue,
            description: description,
            coordinates: previewCoords,
            ward: wardName,
            status: "active",
            upvotes: 0,
            verified: false,
          },
        ])
        .select();

      if (error) throw error;

      // SUCCESS FLOW:
      // Show Success Toast
      setSuccessToast(t.successMsg);
      setTimeout(() => setSuccessToast(""), 3000);

      // Reset Form State
      setPreviewCoords(null);
      setSelectedIssue("");
      setSelectedSeverity("");
      setDescription("");

      // Immediately refresh list & map
      await fetchFloodReports();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Inject dynamic animations inside useEffect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("flood-styles")) {
      const style = document.createElement("style");
      style.id = "flood-styles";
      style.innerHTML = `
        @keyframes pulse-glow-blue {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.6);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(2, 132, 199, 0);
            transform: scale(1.08);
          }
        }
        .blinking-cursor-map {
          cursor: crosshair !important;
        }
        .scrollbar-feed::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-feed::-webkit-scrollbar-track {
          background: #f0f9ff;
        }
        .scrollbar-feed::-webkit-scrollbar-thumb {
          background: #0ea5e9;
          border-radius: 10px;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f0f9ff",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#16a34a",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(22, 163, 74, 0.25)",
            zIndex: 9999,
            fontWeight: 700,
            fontSize: "14px",
            animation: "pulse-glow-blue 1.5s infinite",
          }}
        >
          {successToast}
        </div>
      )}

      {/* Header Bar */}
      <header
        style={{
          background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)",
          color: "white",
          padding: "1rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          zIndex: 100,
          boxShadow: "0 4px 12px rgba(12, 74, 110, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              href="/"
              style={{
                fontSize: "20px",
                color: "white",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                minHeight: "44px",
                paddingRight: "8px",
              }}
            >
              ←
            </Link>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              {t.title}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                padding: "4px 12px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              {floodReports.length} REPORTS
            </span>
            <LangToggle />
          </div>
        </div>
        <p style={{ fontSize: "0.8rem", opacity: 0.9, margin: 0, fontWeight: 500 }}>{t.subtitle}</p>
      </header>

      {/* Tool Selector Buttons above the Map */}
      <section
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 16px",
          background: "#e0f2fe",
          borderBottom: "1px solid #bae6fd",
          zIndex: 50,
        }}
      >
        {/* Tool 1 */}
        <button
          onClick={() => {
            setActiveTool("point");
            setPreviewCoords(null);
            setSegmentStart(null);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem 0.5rem",
            borderRadius: "12px",
            minHeight: "52px",
            background: activeTool === "point" ? "#0369a1" : "white",
            color: activeTool === "point" ? "white" : "#0369a1",
            border: activeTool === "point" ? "none" : "1px solid #bae6fd",
            boxShadow: activeTool === "point" ? "0 4px 10px rgba(3,105,161,0.2)" : "none",
          }}
        >
          <span style={{ fontSize: "16px", marginBottom: "2px" }}>📍</span>
          <span style={{ fontSize: "11px", fontWeight: 700 }}>{t.pinSpot}</span>
          <span style={{ fontSize: "8px", opacity: 0.85, textAlign: "center" }}>
            {t.pinSpotSub}
          </span>
        </button>

        {/* Tool 2 */}
        <button
          onClick={() => {
            setActiveTool("segment");
            setPreviewCoords(null);
            setSegmentStart(null);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem 0.5rem",
            borderRadius: "12px",
            minHeight: "52px",
            background: activeTool === "segment" ? "#0369a1" : "white",
            color: activeTool === "segment" ? "white" : "#0369a1",
            border: activeTool === "segment" ? "none" : "1px solid #bae6fd",
            boxShadow: activeTool === "segment" ? "0 4px 10px rgba(3,105,161,0.2)" : "none",
          }}
        >
          <span style={{ fontSize: "16px", marginBottom: "2px" }}>〰️</span>
          <span style={{ fontSize: "11px", fontWeight: 700 }}>{t.markRoad}</span>
          <span style={{ fontSize: "8px", opacity: 0.85, textAlign: "center" }}>
            {t.markRoadSub}
          </span>
        </button>

        {/* Tool 3 */}
        <button
          onClick={() => {
            setActiveTool("zone");
            setPreviewCoords(null);
            setSegmentStart(null);
          }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem 0.5rem",
            borderRadius: "12px",
            minHeight: "52px",
            background: activeTool === "zone" ? "#0369a1" : "white",
            color: activeTool === "zone" ? "white" : "#0369a1",
            border: activeTool === "zone" ? "none" : "1px solid #bae6fd",
            boxShadow: activeTool === "zone" ? "0 4px 10px rgba(3,105,161,0.2)" : "none",
          }}
        >
          <span style={{ fontSize: "16px", marginBottom: "2px" }}>⭕</span>
          <span style={{ fontSize: "11px", fontWeight: 700 }}>{t.markArea}</span>
          <span style={{ fontSize: "8px", opacity: 0.85, textAlign: "center" }}>
            {t.markAreaSub}
          </span>
        </button>
      </section>

      {/* Interactive Map Layout Container */}
      <section style={{ height: "55vh", position: "relative", width: "100%" }}>
        <div
          ref={mapContainerRef}
          className={activeTool === "point" && !previewCoords ? "blinking-cursor-map" : ""}
          style={{ width: "100%", height: "100%", zIndex: 10 }}
        />

        {/* Last updated Indicator overlay */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(4px)",
            padding: "5px 12px",
            borderRadius: "8px",
            fontSize: "11px",
            color: "#0369a1",
            fontWeight: 700,
            zIndex: 990,
            border: "1px solid #bae6fd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {t.lastUpdated}: {timeSinceUpdate}
        </div>

        {/* Leaflet Loading state */}
        {!leafletLoaded && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255,255,255,0.85)",
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
                padding: "20px 30px",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              <span style={{ fontSize: "28px" }}>🌧️</span>
              <p
                style={{ margin: "8px 0 0 0", fontSize: "14px", fontWeight: 700, color: "#0369a1" }}
              >
                Loading Monsoon Watch Map...
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Panel Wrapper containing Radius Slider, Form Panel, and Feed */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          boxShadow: "0 -4px 15px rgba(12, 74, 110, 0.08)",
          zIndex: 40,
          overflowY: "auto",
        }}
        className="scrollbar-feed"
      >
        {/* Radius control slider: Displayed only when Zone tool is active and a center point is chosen */}
        {activeTool === "zone" && previewCoords && previewCoords.type === "zone" && (
          <div
            style={{
              padding: "12px 16px",
              background: "#f0f9ff",
              borderBottom: "1px solid #bae6fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", minWidth: "90px" }}>
              ⭕ {t.radiusLabel}: {(previewCoords.radiusKm || radiusKmState).toFixed(1)} km
            </span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={previewCoords.radiusKm || radiusKmState}
              onChange={handleRadiusSlider}
              style={{
                flex: 1,
                cursor: "pointer",
                height: "6px",
                borderRadius: "3px",
                outline: "none",
                background: "#bae6fd",
              }}
            />
          </div>
        )}

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* If the user has placed a coordinate selection (point, segment or zone) on the map, show form */}
          {previewCoords ? (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Issue Type Selector */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#64748b",
                    marginBottom: "8px",
                  }}
                >
                  {t.issueTypeLabel}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {Object.entries(t.issueTypes).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedIssue(key)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: selectedIssue === key ? "#0369a1" : "#f1f5f9",
                        color: selectedIssue === key ? "white" : "#475569",
                        border: selectedIssue === key ? "none" : "1px solid #e2e8f0",
                        minHeight: "36px",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selector */}
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#64748b",
                    marginBottom: "8px",
                  }}
                >
                  {t.severityLabel}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {Object.entries(t.severities).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedSeverity(key)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 700,
                        textAlign: "left",
                        cursor: "pointer",
                        background: selectedSeverity === key ? "#0369a1" : "white",
                        color: selectedSeverity === key ? "white" : "#1e293b",
                        border: selectedSeverity === key ? "none" : "1.5px solid #bae6fd",
                        minHeight: "48px", // tap targets
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Description */}
              <div>
                <label
                  htmlFor="flood-desc"
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#64748b",
                    marginBottom: "6px",
                  }}
                >
                  {t.descLabel}
                </label>
                <textarea
                  id="flood-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder={t.descPlaceholder}
                  rows={2}
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    border: "1.5px solid #bae6fd",
                    padding: "10px 12px",
                    fontSize: "13px",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    textAlign: "right",
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  {description.length}/200
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedIssue || !selectedSeverity || submitting}
                style={{
                  background: "#0369a1",
                  color: "white",
                  padding: "12px",
                  borderRadius: "14px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "54px",
                  boxShadow: "0 6px 15px rgba(3,105,161,0.25)",
                }}
              >
                {submitting ? t.submitting : t.submitBtn}
              </button>
            </form>
          ) : (
            // Default help panel encouraging map interaction
            <div
              style={{
                textAlign: "center",
                padding: "24px 16px",
                border: "2px dashed #bae6fd",
                borderRadius: "16px",
                background: "#f8fafc",
              }}
            >
              <span style={{ fontSize: "36px", display: "block", marginBottom: "10px" }}>🗺️</span>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0369a1",
                  lineHeight: 1.5,
                }}
              >
                {t.helperText}
              </p>
            </div>
          )}

          {/* Scrolling Feed Section */}
          <div style={{ marginTop: "10px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#0c4a6e",
                marginBottom: "12px",
                borderBottom: "2px solid #e0f2fe",
                paddingBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>🌧️ {t.recentReports}</span>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                ({t.lastUpdated}: {timeSinceUpdate})
              </span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {floodReports.length === 0 ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "12px",
                  }}
                >
                  No reports logged yet.
                </p>
              ) : (
                floodReports.map((report) => {
                  const sevColor = SEVERITY_COLORS[report.severity] || {
                    bg: "#f1f5f9",
                    text: "#475569",
                  };
                  const isResolved = report.status === "resolved";

                  return (
                    <div
                      key={report.id}
                      style={{
                        background: "white",
                        border: "1px solid #bae6fd",
                        borderRadius: "14px",
                        padding: "12px",
                        display: "flex",
                        gap: "10px",
                        boxShadow: "0 2px 6px rgba(3,105,161,0.02)",
                      }}
                    >
                      {/* Left Side Emoji Avatar */}
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: "#f0f9ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          flexShrink: 0,
                          border: "1px solid #bae6fd",
                        }}
                      >
                        {report.issue_type.split(" ")[0]}
                      </div>

                      {/* Middle Details */}
                      <div
                        style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span style={{ fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>
                            {report.issue_type}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: sevColor.bg,
                              color: sevColor.text,
                            }}
                          >
                            {report.severity}
                          </span>
                        </div>

                        {/* Location / Ward / Timeago */}
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span>
                            📍 {t.ward} {report.ward || "Hyderabad"}
                          </span>
                          <span>·</span>
                          <span>{formatTimeAgo(report.created_at)}</span>
                        </div>

                        {/* Optional short description */}
                        {report.description && (
                          <p
                            style={{
                              margin: "4px 0 0 0",
                              fontSize: "12px",
                              color: "#334155",
                              background: "#f8fafc",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              borderLeft: "2px solid #0369a1",
                            }}
                          >
                            {report.description}
                          </p>
                        )}
                      </div>

                      {/* Right Actions (Status dot & Upvotes) */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                          flexShrink: 0,
                          gap: "8px",
                        }}
                      >
                        {/* Status badge dot */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: isResolved ? "#16a34a" : "#dc2626",
                              display: "inline-block",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: isResolved ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {isResolved ? t.statusResolved : t.statusActive}
                          </span>
                        </div>

                        {/* Upvote count and button */}
                        <button
                          onClick={() => handleUpvote(report.id)}
                          disabled={upvotingId !== null}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            borderRadius: "8px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#0369a1",
                            cursor: "pointer",
                            minHeight: "32px",
                          }}
                        >
                          👍 {report.upvotes || 0}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
