# Engineering decisions

## 2026-10-21 — Milestone 1 foundation
- Next.js App Router, React, strict TypeScript, Tailwind CSS, Lucide icons. An owned button component follows the shadcn/ui `cva` variant pattern without introducing a component framework runtime. System fonts avoid network font dependencies.
- Use Node.js 24 LTS (`.nvmrc`) for current test/lint dependencies. The host's Node 20 is too old for current tooling; verification uses the available bundled Node 24.
- `idb` wraps IndexedDB. Database `findcarparked`, schema version 1, `sessions` store, primary key `id`, status index. Future schema changes belong in versioned upgrade callbacks; never reset a database to migrate it.
- Replacement queries all active sessions and archives them alongside the new insert in one readwrite transaction. IndexedDB serializes competing writes across tabs. Transaction failure rolls back archival. Wait for `tx.done` before returning success.
- Model and input validation are independent of UI. Normalize required strings, uppercase level/row, reject empty and excessive lengths. Use UUIDs and ISO timestamps. No TTL, retention deletion, or storage cleanup.
- React component state is sufficient; no Zustand or backend. Read on launch and again on focus/visibility changes. Show loading before empty state. Disable writes after an unresolved read failure to avoid obscuring an unknown existing location.
- Database-open reads have a bounded UI wait with retry; writes are never timed out by the UI because a pending write may still commit. Do not report a failed save while its transaction is still pending.
- Previous sessions are archived now to meet persistence requirements; browsing and deletion are deferred to Milestone 2. Persistent-storage requests, installability, offline shell, dark mode, and camera remain assigned to their roadmap milestones.
- Browser-managed storage is not permanent. Safari/PWA storage is scoped to the browser and origin; changing scheme, hostname, or port changes the storage area. Private browsing is unsuitable for durable storage. Real iPhone restarts and actual seven-day retention require physical-device follow-up.
- No external runtime services or data collection. Hosting requires separate owner approval. Do not connect or publish a Vercel project automatically.
