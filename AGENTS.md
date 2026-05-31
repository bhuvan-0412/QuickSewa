# QuickSewa Agent Guidelines (AGENTS.md)

Welcome, AI agent! This document contains system architecture notes and guidelines for modifying this codebase safely.

---

## 1. Project Directory Structure

```
.
├── app/                  # Next.js App Router source
│   ├── components/       # Shared UI components (e.g., LangToggle.js)
│   ├── dashboard/        # Dashboard view
│   ├── map/              # Leaflet-based map view
│   ├── report/           # Main issue reporting page and details
│   ├── globals.css       # Core design styles
│   └── layout.js         # Base HTML layout & context provider wrappers
├── app/lib/              # Business logic utilities
│   ├── language.js       # Multilingual translations context
│   └── supabase.js       # Supabase client setup
├── public/               # Public assets (images, static files)
├── package.json          # Dependency definition
├── schema_migration.sql  # SQL schema migrations
└── Dockerfile            # Multi-stage production Docker build
```

---

## 2. Key Technology Integrations

* **Next.js (App Router)**: Uses React Server Components and Client Components appropriately. Client components must be marked with `"use client"` at the top.
* **Supabase**: Utilized for auth, database, and object storage. Direct connection client is configured in `app/lib/supabase.js`.
* **Google Gemini API**: Configured for vision analysis. If you add or modify photo upload workflows, ensure you pass the Base64 image payload to Gemini for automated categorization.
* **Leaflet & OpenStreetMap**: Standard mapping integration. Always load Leaflet assets or run Leaflet hooks safely inside browser-only hooks (`useEffect`) since Next.js uses server-side pre-rendering.

---

## 3. Modifying Style & Design System

* Core colors, variables, and global classes are defined in `app/globals.css`.
* We use **Vanilla CSS** for application styling. Do not introduce Tailwind classes unless requested by the user.
* Maintain **glassmorphism**, rich gradients, and smooth transition effects to keep the UI premium and aesthetic.

---

## 4. Coding Conventions & Quality Checks

Before marking a task as done, ensure you run the local validation suite:
* **Linting**: Run `npm run lint` to trigger ESLint and Biome code verification.
* **Formatting**: Ensure your file edits conform to Biome's formatting guidelines.
* **Dead Code**: Run `npm run knip` to verify there are no orphaned exports or unused files.
* **Testing**: Run `npm run test` to verify no regressions were introduced.

---

## 5. Security & Secret Management

* Never check in API keys or configuration details directly to files under version control.
* Use `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `process.env.NEXT_PUBLIC_GEMINI_API_KEY` for runtime values.
* Ensure any new secrets or local variables are reflected in `.env.example` without exposing active values.
