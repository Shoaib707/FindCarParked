# FindCarParked

## Vision
A private, mobile-first parking reminder for people who use large, multilevel garages. Open the app and immediately see the last saved garage, level, and row. Primary platform: iPhone Safari; secondary: modern desktop and mobile browsers.

## Approved scope and priorities
Reliability comes first: local IndexedDB storage, one active session, atomic replacement with archiving, no automatic expiry, validation before writes, and success only after transaction completion. No backend, accounts, analytics, photo uploads, or paid services.

Milestone 1 includes the home dashboard, manual entry (garage, level, row, optional spot), automatic timestamps, loading and failure states, and automated verification. The example `2121 Crystal Drive / G1 / F` is test input, never preloaded user data.

Later approved roadmap directions: history and garage memory, camera and on-device OCR, PWA/offline installation, polish, then separately approved NFC and experimental automation/navigation research. Do not promise indoor GPS accuracy or native iOS capabilities.

## Acceptance criteria
- A user can save valid data and see it immediately on the dashboard.
- Normal refreshes and browser reopening retrieve the same session.
- A replacement archives the previous session atomically.
- Invalid data and failed writes preserve the previous active session.
- Read failures display recovery guidance; loading does not flash an empty state.
- Sessions never expire based on age.
- Storage limitations are visible: clearing website data or browser eviction can remove data.

## Product authority
The product owner approves milestone progression, public deployment, significant scope changes, paid services, authentication, external data collection, and deletion of important user data. Milestone 1 was explicitly authorized in the master requirements. Stop for review before Milestone 2.
