# Roadmap

Current stage: **Milestone 1 — Working Parking Reminder**, **completed and verified; awaiting product-owner approval** before Milestone 2. Verification: 12 storage tests, 12 Chromium/WebKit browser tests, ESLint, strict TypeScript, and production build passed. Physical iPhone lifecycle/retention checks remain manual.

1. **Working Parking Reminder:** Next.js, strict TypeScript, Tailwind, responsive design, manual entry, transactional IndexedDB persistence, launch retrieval, replacement, errors, tests, documentation.
2. **Parking History and Garage Memory:** history UI, details, garage suggestions, notes, entrances, elevators, richer forms. Sessions are already archived internally by Milestone 1.
3. **Camera and OCR:** camera/upload, on-device OCR, independent sign parser, editable review, persistent photographs, failure handling and tests.
4. **PWA and Offline Reliability:** manifest, installation icons, service worker, offline shell and data, persistent-storage request, physical iPhone checks. Not delivered in Milestone 1.
5. **Product Polish:** dark mode, accessibility audit, refinements and performance.
6. **NFC Integration:** separately approved investigation of HTTPS tag workflows. No Web NFC assumptions on iPhone.
7. **Automatic Parking Detection:** separately approved feasibility research; no reliable exact floor/row promise.
8. **Indoor Navigation:** separately approved maps/landmarks and positioning research.

No public deployment authorized. No authentication, cloud sync, tracking, paid infrastructure, or automatic deletion.
