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
    drawFreehand: "Draw",
    drawFreehandSub: "Freehand — trace the flooded road",
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
    insPin: "👆 Tap the map to place a flood pin",
    insSegmentStart: "👆 Tap the START point of the flooded road",
    insSegmentEnd: "👆 Now tap the END point of the flooded road",
    insDraw: "✏️ Hold and drag to draw the flooded road",
    insZoneCenter: "👆 Tap the CENTER of the flooded area",
    insZoneRadius: "↔️ Drag the circle edge or use slider to set size",
    roadSnapOn: "🛣️ Road snap: ON",
    roadSnapOff: "🛣️ Road snap: OFF",
    snapHintText:
      "💡 Tip: Zoom in for more accurate road selection. Draw along the road centerline for best results.",
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
    drawFreehand: "గీయండి",
    drawFreehandSub: "ఫ్రీహ్యాండ్ — వరద రోడ్డును గీయండి",
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
    insPin: "👆 వరద పిన్ ఉంచడానికి మ్యాప్ నొక్కండి",
    insSegmentStart: "👆 వరద రోడ్డు ప్రారంభ బిందువును నొక్కండి",
    insSegmentEnd: "👆 ఇప్పుడు వరద రోడ్డు ముగింపు బిందువును నొక్కండి",
    insDraw: "✏️ వరద రోడ్డును గీయడానికి నొక్కి పట్టుకుని లాగండి",
    insZoneCenter: "👆 వరద ప్రాంతం మధ్యలో నొక్కండి",
    insZoneRadius: "↔️ పరిమాణాన్ని సెట్ చేయడానికి వృత్తం అంచును లాగండి లేదా స్లైడర్‌ను ఉపయోగించండి",
    roadSnapOn: "🛣️ రోడ్ స్నాప్: ఆన్",
    roadSnapOff: "🛣️ రోడ్ స్నాప్: ఆఫ్",
    snapHintText: "💡 చిట్కా: మరింత ఖచ్చితమైన రహదారి ఎంపిక కోసం జూమ్ చేయండి. ఉత్తమ ఫలితాల కోసం రహదారి మధ్యరేఖ వెంబడి గీయండి.",
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
  const [activeTool, setActiveTool] = useState("point"); // 'point' | 'segment' | 'zone' | 'draw'

  // Geolocation & drawing states
  const [previewCoords, setPreviewCoords] = useState(null);
  const [segmentStart, setSegmentStart] = useState(null);
  const [radiusKmState, setRadiusKmState] = useState(0.3); // Default 300m

  // Road Snapping states
  const [followRoadsMode, setFollowRoadsMode] = useState(false);
  const [showSnapHint, setShowSnapHint] = useState(false);
  const [snapHintOpacity, setSnapHintOpacity] = useState(0);

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

  // References for map interaction state & Freehand drawing
  const userHasInteracted = useRef(false);
  const isDrawing = useRef(false);
  const drawnPoints = useRef([]);
  const drawnPolyline = useRef(null);

  // Resizable Bottom Panel States
  const panelRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

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

  // Simplify Freehand points using simple Euclidean distance check
  const simplifyPoints = useCallback((points, tolerance) => {
    if (points.length <= 2) return points;
    const result = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = result[result.length - 1];
      const curr = points[i];
      const dist = Math.sqrt((curr[0] - prev[0]) ** 2 + (curr[1] - prev[1]) ** 2);
      if (dist > tolerance) result.push(curr);
    }
    result.push(points[points.length - 1]);
    return result;
  }, []);

  // Fetch all reports from Supabase
  const fetchFloodReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("flood_reports")
        .select("*")
        .order("created_at", { ascending: false });
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

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchFloodReports();

    const channel = supabase
      .channel("flood_reports_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "flood_reports",
        },
        () => {
          fetchFloodReports();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Resizable bottom panel drag logic handlers
  const onDragStart = (e) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY || e.touches?.[0]?.clientY;
    startHeightRef.current = panelRef.current.offsetHeight;

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("touchend", onDragEnd);
  };

  const onDragMove = (e) => {
    if (!isDraggingRef.current) return;
    // Prevent default scroll behavior while dragging bottom sheet on touch
    if (e.cancelable) {
      e.preventDefault();
    }
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const delta = startYRef.current - clientY;
    const newHeight = Math.min(
      Math.max(startHeightRef.current + delta, 120),
      window.innerHeight * 0.8,
    );
    panelRef.current.style.transition = "none";
    panelRef.current.style.height = `${newHeight}px`;
  };

  const onDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);

    // Apply snap heights with transitions
    panelRef.current.style.transition = "height 0.15s ease";
    const h = panelRef.current.offsetHeight;
    const vh = window.innerHeight;

    if (h < vh * 0.25) {
      panelRef.current.style.height = "120px";
    } else if (h < vh * 0.6) {
      panelRef.current.style.height = "45vh";
    } else {
      panelRef.current.style.height = "75vh";
    }
  };

  const handleExpand = () => {
    if (panelRef.current) {
      panelRef.current.style.transition = "height 0.15s ease";
      panelRef.current.style.height = "75vh";
    }
  };

  const handleCollapse = () => {
    if (panelRef.current) {
      panelRef.current.style.transition = "height 0.15s ease";
      panelRef.current.style.height = "120px";
    }
  };

  // Road snapping hint overlay lifecycle helper
  useEffect(() => {
    if (previewCoords && previewCoords.type === "segment") {
      setShowSnapHint(true);
      setSnapHintOpacity(1);
      const fadeTimer = setTimeout(() => {
        setSnapHintOpacity(0);
      }, 3000);
      const hideTimer = setTimeout(() => {
        setShowSnapHint(false);
      }, 4000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [previewCoords]);

  // Leaflet Map Initialization (Runs only once)
  useEffect(() => {
    if (!leafletLoaded) return;
    if (typeof window === "undefined") return;
    const L = window.L;
    if (!L) return;

    if (window._floodMap) {
      try {
        window._floodMap.remove();
      } catch (e) {
        console.warn("Failed to remove previous map:", e);
      }
      window._floodMap = null;
    }

    if (mapContainerRef.current) {
      mapContainerRef.current._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
    });

    // Only set view if the user has not panned or zoomed already
    if (!userHasInteracted.current) {
      map.setView([17.385, 78.4867], 12);
    }

    window._floodMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const layers = L.layerGroup().addTo(map);
    window._floodLayers = layers;

    // Track user camera interactions to disable auto-zoom resets
    map.on("movestart", () => {
      userHasInteracted.current = true;
    });
    map.on("zoomstart", () => {
      userHasInteracted.current = true;
    });

    return () => {
      if (window._floodMap) {
        try {
          window._floodMap.remove();
        } catch (e) {
          console.warn("Failed cleanup map:", e);
        }
        window._floodMap = null;
        window._floodLayers = null;
      }
    };
  }, [leafletLoaded]);

  // Freehand drawing callbacks
  const startDraw = useCallback(
    (e) => {
      if (activeTool !== "draw") return;
      isDrawing.current = true;

      const map = window._floodMap;
      if (!map) return;

      const latlng = e.latlng || map.mouseEventToLatLng(e.originalEvent || e);
      if (!latlng) return;

      drawnPoints.current = [[latlng.lat, latlng.lng]];

      if (drawnPolyline.current) {
        drawnPolyline.current.remove();
      }

      const L = window.L;
      drawnPolyline.current = L.polyline(drawnPoints.current, {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.85,
      }).addTo(map);

      map.dragging.disable();
    },
    [activeTool],
  );

  const continueDraw = useCallback((e) => {
    if (!isDrawing.current || !drawnPolyline.current) return;
    const map = window._floodMap;
    if (!map) return;

    const latlng = e.latlng || map.mouseEventToLatLng(e.originalEvent || e);
    if (!latlng) return;

    const lastPoint = drawnPoints.current[drawnPoints.current.length - 1];
    const dist = Math.sqrt((latlng.lat - lastPoint[0]) ** 2 + (latlng.lng - lastPoint[1]) ** 2);
    if (dist > 0.00005) {
      drawnPoints.current.push([latlng.lat, latlng.lng]);
      drawnPolyline.current.setLatLngs(drawnPoints.current);
    }
  }, []);

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const map = window._floodMap;
    if (map) {
      map.dragging.enable();
    }

    if (drawnPoints.current.length > 2) {
      const simplified = simplifyPoints(drawnPoints.current, 0.0001);
      setPreviewCoords({
        type: "freehand",
        points: simplified,
      });

      if (drawnPolyline.current) {
        drawnPolyline.current.remove();
        drawnPolyline.current = null;
      }
    }
  }, [simplifyPoints]);

  // Update map layer graphics on changes without map reconstruction
  useEffect(() => {
    if (!leafletLoaded) return;
    if (typeof window === "undefined") return;
    const L = window.L;
    const map = window._floodMap;
    const layers = window._floodLayers;
    if (!map || !layers) return;

    // Clear old layers before redrawing
    layers.clearLayers();

    // Redraw existing flood reports (only active/in-progress)
    const visibleReports = floodReports.filter(
      (r) => r.status === "active" || r.status === "in-progress",
    );
    visibleReports.forEach((report) => {
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
        const lat = parseFloat(coords.lat);
        const lng = parseFloat(coords.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          console.warn("Skipping invalid point coordinates for report:", report.id);
          return;
        }
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
        L.marker([lat, lng], { icon: pointIcon }).addTo(layers).bindPopup(popupHtml);
      } else if (coords.type === "segment") {
        const polyPoints = coords.points || [coords.start, coords.end];
        if (!Array.isArray(polyPoints)) {
          console.warn("Skipping invalid segment points for report:", report.id);
          return;
        }
        const validPoints = [];
        for (const pt of polyPoints) {
          let lat, lng;
          if (Array.isArray(pt)) {
            lat = parseFloat(pt[0]);
            lng = parseFloat(pt[1]);
          } else if (pt && typeof pt === "object") {
            lat = parseFloat(pt.lat);
            lng = parseFloat(pt.lng);
          }
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            validPoints.push([lat, lng]);
          }
        }
        if (validPoints.length < 2) {
          console.warn("Skipping segment with insufficient coordinates:", report.id);
          return;
        }
        L.polyline(validPoints, {
          color: "#1e40af", // dark blue
          weight: 6,
          opacity: 0.85,
        })
          .addTo(layers)
          .bindPopup(popupHtml);
      } else if (coords.type === "freehand") {
        if (!Array.isArray(coords.points)) {
          console.warn("Skipping invalid freehand points for report:", report.id);
          return;
        }
        const validPoints = [];
        for (const pt of coords.points) {
          let lat, lng;
          if (Array.isArray(pt)) {
            lat = parseFloat(pt[0]);
            lng = parseFloat(pt[1]);
          } else if (pt && typeof pt === "object") {
            lat = parseFloat(pt.lat);
            lng = parseFloat(pt.lng);
          }
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            validPoints.push([lat, lng]);
          }
        }
        if (validPoints.length < 2) {
          console.warn("Skipping freehand with insufficient coordinates:", report.id);
          return;
        }
        L.polyline(validPoints, {
          color: "#1e40af", // dark blue freehand segment
          weight: 6,
          opacity: 0.85,
        })
          .addTo(layers)
          .bindPopup(popupHtml);
      } else if (coords.type === "zone") {
        if (!coords.center) {
          console.warn("Skipping zone with missing center:", report.id);
          return;
        }
        const lat = parseFloat(coords.center.lat);
        const lng = parseFloat(coords.center.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          console.warn("Skipping invalid zone center coordinates:", report.id);
          return;
        }
        L.circle([lat, lng], {
          radius: (coords.radiusKm || 0.3) * 1000,
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.25,
          weight: 2,
        })
          .addTo(layers)
          .bindPopup(popupHtml);
      }
    });

    // Draw active preview elements (blue)
    if (previewCoords) {
      if (previewCoords.type === "point") {
        const lat = parseFloat(previewCoords.lat);
        const lng = parseFloat(previewCoords.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
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
          L.marker([lat, lng], { icon: previewIcon }).addTo(layers);
        }
      } else if (previewCoords.type === "segment") {
        const startLat = parseFloat(previewCoords.start?.lat);
        const startLng = parseFloat(previewCoords.start?.lng);
        const endLat = parseFloat(previewCoords.end?.lat);
        const endLng = parseFloat(previewCoords.end?.lng);

        if (
          !Number.isNaN(startLat) &&
          !Number.isNaN(startLng) &&
          !Number.isNaN(endLat) &&
          !Number.isNaN(endLng)
        ) {
          // Start marker: blue circle instead of green
          const startIcon = L.divIcon({
            className: "",
            html: `<div style="
              width: 38px; height: 22px; background: #3b82f6; color: white; border: 2px solid white;
              border-radius: 8px; display: flex; align-items: center; justify-content: center;
              font-size: 9px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">Start</div>`,
            iconSize: [38, 22],
            iconAnchor: [19, 11],
          });
          // End marker: dark blue circle instead of red
          const endIcon = L.divIcon({
            className: "",
            html: `<div style="
              width: 38px; height: 22px; background: #1e40af; color: white; border: 2px solid white;
              border-radius: 8px; display: flex; align-items: center; justify-content: center;
              font-size: 9px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">End</div>`,
            iconSize: [38, 22],
            iconAnchor: [19, 11],
          });

          L.marker([startLat, startLng], { icon: startIcon }).addTo(layers);
          L.marker([endLat, endLng], { icon: endIcon }).addTo(layers);

          const linePoints = [];
          if (Array.isArray(previewCoords.points)) {
            for (const pt of previewCoords.points) {
              let pLat, pLng;
              if (Array.isArray(pt)) {
                pLat = parseFloat(pt[0]);
                pLng = parseFloat(pt[1]);
              } else if (pt && typeof pt === "object") {
                pLat = parseFloat(pt.lat);
                pLng = parseFloat(pt.lng);
              }
              if (!Number.isNaN(pLat) && !Number.isNaN(pLng)) {
                linePoints.push([pLat, pLng]);
              }
            }
          }
          if (linePoints.length < 2) {
            linePoints.push([startLat, startLng], [endLat, endLng]);
          }

          L.polyline(linePoints, {
            color: "#3b82f6", // light blue dashed
            weight: 5,
            dashArray: "8,6",
            opacity: 0.7,
          }).addTo(layers);
        }
      } else if (previewCoords.type === "freehand") {
        if (Array.isArray(previewCoords.points)) {
          const validPoints = [];
          for (const pt of previewCoords.points) {
            let pLat, pLng;
            if (Array.isArray(pt)) {
              pLat = parseFloat(pt[0]);
              pLng = parseFloat(pt[1]);
            } else if (pt && typeof pt === "object") {
              pLat = parseFloat(pt.lat);
              pLng = parseFloat(pt.lng);
            }
            if (!Number.isNaN(pLat) && !Number.isNaN(pLng)) {
              validPoints.push([pLat, pLng]);
            }
          }
          if (validPoints.length >= 2) {
            L.polyline(validPoints, {
              color: "#3b82f6", // light blue preview
              weight: 5,
              opacity: 0.85,
            }).addTo(layers);
          }
        }
      } else if (previewCoords.type === "zone") {
        if (previewCoords.center) {
          const centerLat = parseFloat(previewCoords.center.lat);
          const centerLng = parseFloat(previewCoords.center.lng);
          if (!Number.isNaN(centerLat) && !Number.isNaN(centerLng)) {
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

            const previewCircle = L.circle([centerLat, centerLng], {
              radius: (previewCoords.radiusKm || 0.3) * 1000,
              color: "#0284c7",
              fillColor: "#0ea5e9",
              fillOpacity: 0.25,
              weight: 2,
            }).addTo(layers);

            const centerMarker = L.marker([centerLat, centerLng], {
              icon: dragIcon,
              draggable: true,
            }).addTo(layers);

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
        }
      }
    } else if (segmentStart) {
      const startLat = parseFloat(segmentStart.lat);
      const startLng = parseFloat(segmentStart.lng);
      if (!Number.isNaN(startLat) && !Number.isNaN(startLng)) {
        const startIcon = L.divIcon({
          className: "",
          html: `<div style="
            width: 38px; height: 22px; background: #3b82f6; color: white; border: 2px solid white;
            border-radius: 8px; display: flex; align-items: center; justify-content: center;
            font-size: 9px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">Start</div>`,
          iconSize: [38, 22],
          iconAnchor: [19, 11],
        });
        L.marker([startLat, startLng], { icon: startIcon }).addTo(layers);
      }
    }

    // Set cursor crosshair for draw tool
    if (activeTool === "draw") {
      map.getContainer().style.cursor = "crosshair";

      // Bind drawing mouse and touch events
      map.on("mousedown", startDraw);
      map.on("mousemove", continueDraw);
      map.on("mouseup", endDraw);
      map.on("touchstart", startDraw);
      map.on("touchmove", continueDraw);
      map.on("touchend", endDraw);
    } else {
      map.getContainer().style.cursor = "";
    }

    // Dynamic map tap click listener based on active tool (Prevents React stale closures)
    map.off("click");
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (activeTool === "point") {
        setPreviewCoords({ type: "point", lat, lng });
      } else if (activeTool === "segment") {
        if (!segmentStart) {
          setSegmentStart({ lat, lng });
        } else {
          const start = segmentStart;
          const end = { lat, lng };

          if (followRoadsMode) {
            fetch(
              `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`,
            )
              .then((r) => r.json())
              .then((data) => {
                if (data.routes?.[0]) {
                  const coords = data.routes[0].geometry.coordinates;
                  const latLngs = coords.map((c) => [c[1], c[0]]);
                  setPreviewCoords({
                    type: "segment",
                    start,
                    end,
                    points: latLngs,
                    snapped: true,
                  });
                } else {
                  setPreviewCoords({ type: "segment", start, end });
                }
              })
              .catch((err) => {
                console.warn(
                  "OSRM snapped route failed, falling back to straight segment line:",
                  err,
                );
                setPreviewCoords({ type: "segment", start, end });
              });
          } else {
            setPreviewCoords({ type: "segment", start, end });
          }
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
      // Unbind drawing listeners on tool toggle or state change
      map.off("mousedown", startDraw);
      map.off("mousemove", continueDraw);
      map.off("mouseup", endDraw);
      map.off("touchstart", startDraw);
      map.off("touchmove", continueDraw);
      map.off("touchend", endDraw);
    };
  }, [
    leafletLoaded,
    floodReports,
    previewCoords,
    activeTool,
    segmentStart,
    radiusKmState,
    followRoadsMode,
    formatTimeAgo,
    startDraw,
    continueDraw,
    endDraw,
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
      } else if (previewCoords.type === "freehand") {
        wardName = getWard(previewCoords.points[0][0], previewCoords.points[0][1]);
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

  // Pulse instruction bar text helper
  const getInstructionText = () => {
    if (activeTool === "point") {
      return t.insPin;
    }
    if (activeTool === "segment") {
      return segmentStart ? t.insSegmentEnd : t.insSegmentStart;
    }
    if (activeTool === "draw") {
      return t.insDraw;
    }
    if (activeTool === "zone") {
      return previewCoords && previewCoords.type === "zone" ? t.insZoneRadius : t.insZoneCenter;
    }
    return "";
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
        @keyframes pulse-instruct {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.99); }
        }
        .pulsing-bar {
          animation: pulse-instruct 2s infinite ease-in-out;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const totalReportsCount = floodReports.length;
  const activeReportsCount = floodReports.filter(
    (r) => r.status === "active" || r.status === "in-progress",
  ).length;
  const resolvedReportsCount = floodReports.filter((r) => r.status === "resolved").length;

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

      {/* 3-Column Stats Bar */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1px",
          background: "#bae6fd",
          borderBottom: "1px solid #bae6fd",
          zIndex: 50,
        }}
      >
        <div style={{ background: "white", padding: "10px 6px", textAlign: "center" }}>
          <span
            style={{
              display: "block",
              fontSize: "10px",
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Total Reported
          </span>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#0369a1" }}>
            {totalReportsCount}
          </span>
        </div>
        <div style={{ background: "white", padding: "10px 6px", textAlign: "center" }}>
          <span
            style={{
              display: "block",
              fontSize: "10px",
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Active Issues
          </span>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#dc2626" }}>
            {activeReportsCount}
          </span>
        </div>
        <div style={{ background: "white", padding: "10px 6px", textAlign: "center" }}>
          <span
            style={{
              display: "block",
              fontSize: "10px",
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Resolved
          </span>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#16a34a" }}>
            {resolvedReportsCount}
          </span>
        </div>
      </section>

      {/* Tool Selector Buttons above the Map */}
      <section
        style={{
          display: "flex",
          gap: "6px",
          padding: "10px 12px",
          background: "#e0f2fe",
          borderBottom: "1px solid #bae6fd",
          zIndex: 50,
          flexWrap: "wrap",
        }}
      >
        {/* Tool 1 (Pin) */}
        <button
          onClick={() => {
            setActiveTool("point");
            setPreviewCoords(null);
            setSegmentStart(null);
          }}
          style={{
            flex: 1,
            minWidth: "75px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem 0.3rem",
            borderRadius: "12px",
            minHeight: "52px",
            background: activeTool === "point" ? "#0369a1" : "white",
            color: activeTool === "point" ? "white" : "#0369a1",
            border: activeTool === "point" ? "none" : "1px solid #bae6fd",
            boxShadow: activeTool === "point" ? "0 4px 10px rgba(3,105,161,0.2)" : "none",
          }}
        >
          <span style={{ fontSize: "15px", marginBottom: "1px" }}>📍</span>
          <span style={{ fontSize: "10px", fontWeight: 700 }}>{t.pinSpot}</span>
          <span style={{ fontSize: "7.5px", opacity: 0.85, textAlign: "center", lineHeight: 1.1 }}>
            {t.pinSpotSub}
          </span>
        </button>

        {/* Tool 2 (Segment) */}
        <button
          onClick={() => {
            setActiveTool("segment");
            setPreviewCoords(null);
            setSegmentStart(null);
          }}
          style={{
            flex: 1,
            minWidth: "75px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem 0.3rem",
            borderRadius: "12px",
            minHeight: "52px",
            background: activeTool === "segment" ? "#0369a1" : "white",
            color: activeTool === "segment" ? "white" : "#0369a1",
            border: activeTool === "segment" ? "none" : "1px solid #bae6fd",
            boxShadow: activeTool === "segment" ? "0 4px 10px rgba(3,105,161,0.2)" : "none",
          }}
        >
          <span style={{ fontSize: "15px", marginBottom: "1px" }}>〰️</span>
          <span style={{ fontSize: "10px", fontWeight: 700 }}>{t.markRoad}</span>
          <span style={{ fontSize: "7.5px", opacity: 0.85, textAlign: "center", lineHeight: 1.1 }}>
            {t.markRoadSub}
          </span>
        </button>

        {/* Tool 3 (Zone) */}
        <button
          onClick={() => {
            setActiveTool("zone");
            setPreviewCoords(null);
            setSegmentStart(null);
          }}
          style={{
            flex: 1,
            minWidth: "75px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem 0.3rem",
            borderRadius: "12px",
            minHeight: "52px",
            background: activeTool === "zone" ? "#0369a1" : "white",
            color: activeTool === "zone" ? "white" : "#0369a1",
            border: activeTool === "zone" ? "none" : "1px solid #bae6fd",
            boxShadow: activeTool === "zone" ? "0 4px 10px rgba(3,105,161,0.2)" : "none",
          }}
        >
          <span style={{ fontSize: "15px", marginBottom: "1px" }}>⭕</span>
          <span style={{ fontSize: "10px", fontWeight: 700 }}>{t.markArea}</span>
          <span style={{ fontSize: "7.5px", opacity: 0.85, textAlign: "center", lineHeight: 1.1 }}>
            {t.markAreaSub}
          </span>
        </button>

        {/* Tool 4 (Draw Freehand) */}
        <button
          onClick={() => {
            setActiveTool("draw");
            setPreviewCoords(null);
            setSegmentStart(null);
          }}
          style={{
            flex: 1,
            minWidth: "75px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.6rem 0.3rem",
            borderRadius: "12px",
            minHeight: "52px",
            background: activeTool === "draw" ? "#0369a1" : "white",
            color: activeTool === "draw" ? "white" : "#0369a1",
            border: activeTool === "draw" ? "none" : "1px solid #bae6fd",
            boxShadow: activeTool === "draw" ? "0 4px 10px rgba(3,105,161,0.2)" : "none",
          }}
        >
          <span style={{ fontSize: "15px", marginBottom: "1px" }}>✏️</span>
          <span style={{ fontSize: "10px", fontWeight: 700 }}>{t.drawFreehand}</span>
          <span style={{ fontSize: "7.5px", opacity: 0.85, textAlign: "center", lineHeight: 1.1 }}>
            {t.drawFreehandSub}
          </span>
        </button>
      </section>

      {/* Pulsing Instruction Bar */}
      <div
        style={{
          padding: "8px 14px",
          background: "#dbeafe",
          borderBottom: "1px solid #93c5fd",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 48,
        }}
      >
        <div
          className="pulsing-bar"
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#1e40af",
            textAlign: "center",
          }}
        >
          {getInstructionText()}
        </div>
      </div>

      {/* Interactive Map Layout Container */}
      <section style={{ height: "55vh", position: "relative", width: "100%" }}>
        <div
          ref={mapContainerRef}
          className={activeTool === "point" && !previewCoords ? "blinking-cursor-map" : ""}
          style={{ width: "100%", height: "100%", zIndex: 10 }}
        />

        {/* Road snapping ON/OFF absolute pill toggle */}
        <button
          onClick={() => setFollowRoadsMode((prev) => !prev)}
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: followRoadsMode ? "#dbeafe" : "#f1f5f9",
            color: followRoadsMode ? "#1e40af" : "#64748b",
            border: followRoadsMode ? "1.5px solid #1e40af" : "1.5px solid #cbd5e1",
            padding: "6px 12px",
            borderRadius: "99px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            zIndex: 990,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "inline-flex",
            alignItems: "center",
            minHeight: "34px",
          }}
        >
          {followRoadsMode ? t.roadSnapOn : t.roadSnapOff}
        </button>

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

        {/* Centerline Snapping Tip overlay (appears/fades out automatically) */}
        {showSnapHint && (
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.9)",
              color: "white",
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 500,
              zIndex: 990,
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
              transition: "opacity 1s ease",
              opacity: snapHintOpacity,
              pointerEvents: "none",
            }}
          >
            {t.snapHintText}
          </div>
        )}

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

      {/* Resizable Bottom Sheet Panel Wrapper */}
      <section
        ref={panelRef}
        style={{
          height: "45vh", // default height
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          boxShadow: "0 -4px 20px rgba(12, 74, 110, 0.12)",
          zIndex: 40,
          position: "relative",
          transition: "height 0.15s ease",
        }}
      >
        {/* Drag Handle Bar */}
        <div
          id="drag-handle"
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          style={{
            width: "100%",
            padding: "8px 0 4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "ns-resize",
            background: "transparent",
            touchAction: "none",
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 99,
              background: "#bae6fd",
            }}
          />
        </div>

        {/* Panel Header containing Title & Quick Action buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 16px 8px",
            borderBottom: "1px solid #f0f9ff",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#0c4a6e" }}>
            {previewCoords ? "📝 Report Details" : "📋 Reports & Tools"}
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={handleExpand}
              title="Expand Panel"
              style={{
                minHeight: "48px",
                width: "48px",
                background: "transparent",
                color: "#0369a1",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ↑
            </button>
            <button
              onClick={handleCollapse}
              title="Collapse Panel"
              style={{
                minHeight: "48px",
                width: "48px",
                background: "transparent",
                color: "#0369a1",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ↓
            </button>
          </div>
        </div>

        {/* Scrollable Panel content */}
        <div
          style={{
            flex: 1,
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
              <span
                style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", minWidth: "90px" }}
              >
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
        </div>
      </section>
    </main>
  );
}
