# FindCarParked

A private parking reminder built for iPhone Safari. Save a garage, level, and row; reopen the app to see your location immediately. Data stays in this browser's IndexedDB. No accounts, backend, analytics, or paid APIs.

## Current release
Milestone 1: working manual parking reminder. Saving a new location archives the previous one atomically. History browsing, garage suggestions, camera/OCR, installable PWA/offline shell, and dark mode are future milestones requiring review before progression.

## Run locally
Requires **Node.js 24 LTS** and npm. `.nvmrc` supports `nvm use` if nvm is installed.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production preview:

```sh
npm run build
npm run start
```

The app uses the free open-source Next.js App Router, React, TypeScript, Tailwind CSS, Lucide, and idb. The button is an owned shadcn/ui-style component. No environment variables or service credentials are needed.

## Verify

```sh
npm run check
npx playwright install chromium webkit
npm run test:e2e
```

`check` runs ESLint, strict type checking, unit/integration tests, and a production build. E2E tests run against that production build. Playwright browsers need a one-time download. Browser process launches and the local server may need permission in a restricted environment.

Storage tests cover normalized data, reconnection, atomic archive/replacement, invalid saves, rollback after failed insertion, competing tab writes, simulated seven-day retention, and database failures. Browser tests cover dashboard entry, reload/tab reopen, a real browser process restart with a persistent profile, failure states, and phone/desktop widths in Chromium and WebKit.

See [docs/QA.md](docs/QA.md) for actual results and the physical iPhone checklist. Desktop WebKit is not an actual iPhone.

## Test on your iPhone without public deployment

1. Put your computer and iPhone on the same trusted Wi-Fi network.
2. Run `npm run dev` on the computer and keep it awake. Find your computer’s IP address in System Settings → Wi-Fi → Details → TCP/IP, then open `http://YOUR_COMPUTER_IP:3000` in ordinary iPhone Safari (for example `http://192.168.1.20:3000`). `0.0.0.0` is a server binding address, not a phone URL.
3. Save `2121 Crystal Drive`, level `G1`, row `F`. Refresh, close/reopen Safari, and verify the dashboard.
4. Save another location; verify the replacement. Use the checklist for restart and seven-day retention.

Your computer firewall must permit local connections. HTTP on a private network supports this milestone's manual-entry storage, but future PWA/camera features require HTTPS. Keep using the **same URL and port**: localhost, LAN addresses, and a later Vercel domain each have separate storage. Do not treat private browsing as durable storage.

## Deployment preparation

Ready for the Vercel Hobby plan with default Next.js settings, npm, and Node 24.x. No database service, custom domain, secrets, or paid add-ons are needed. After the product owner authorizes public deployment, import `Shoaib707/FindCarParked`, select the approved branch, keep framework `Next.js`, build `npm run build`, and default output settings. Do not enable analytics or paid add-ons. Use the Vercel-provided HTTPS domain.

Public deployment has **not** been performed or authorized. Local development binds to the network for optional phone testing; stop it when finished.

## Storage and limitations

- Saves commit to IndexedDB; previous sessions are archived without automatic expiry.
- Clearing website data, browser eviction, or certain PWA removal flows can remove local data. There is no cloud backup or sync.
- No service worker yet: opening/reloading the app currently needs a reachable server. Offline launch and Home Screen installability are Milestone 4.
- Physical iPhone restart, Safari lifecycle behavior, and actual seven-day retention require manual testing.
- Saved history is preserved internally; a history screen arrives in Milestone 2.

Product scope: [PRODUCT.md](PRODUCT.md). Progress: [ROADMAP.md](ROADMAP.md). Architecture: [DECISIONS.md](DECISIONS.md).
