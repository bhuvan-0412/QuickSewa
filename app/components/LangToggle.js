"use client";
import { useLang } from "../lib/language";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 99,
        border: "1px solid rgba(22, 163, 74, 0.18)",
        padding: "4px",
        gap: "2px",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        style={{
          padding: "6px 14px",
          borderRadius: 99,
          fontSize: "12px",
          fontWeight: 700,
          border: "none",
          background:
            lang === "en" ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "transparent",
          color: lang === "en" ? "white" : "var(--text-muted)",
          cursor: "pointer",
          transition: "var(--transition)",
          boxShadow: lang === "en" ? "0 2px 8px rgba(22, 163, 74, 0.2)" : "none",
          letterSpacing: "0.5px",
        }}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("te")}
        style={{
          padding: "6px 14px",
          borderRadius: 99,
          fontSize: "12px",
          fontWeight: 700,
          border: "none",
          background:
            lang === "te" ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "transparent",
          color: lang === "te" ? "white" : "var(--text-muted)",
          cursor: "pointer",
          transition: "var(--transition)",
          boxShadow: lang === "te" ? "0 2px 8px rgba(22, 163, 74, 0.2)" : "none",
          fontFamily: "var(--font-telugu), sans-serif",
          letterSpacing: "0.5px",
        }}
      >
        తె
      </button>
    </div>
  );
}
