"use client";
import { useLang } from "../lib/language";

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "white",
        borderRadius: 99,
        border: "1px solid #bbf7d0",
        padding: 3,
        gap: 2,
      }}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        style={{
          padding: "4px 12px",
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          background: lang === "en" ? "#16a34a" : "transparent",
          color: lang === "en" ? "white" : "#6b7280",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("te")}
        style={{
          padding: "4px 12px",
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          background: lang === "te" ? "#16a34a" : "transparent",
          color: lang === "te" ? "white" : "#6b7280",
          cursor: "pointer",
          transition: "all 0.2s",
          fontFamily: "sans-serif",
        }}
      >
        తె
      </button>
    </div>
  );
}
