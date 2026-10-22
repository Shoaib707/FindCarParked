# Milestone 1 verification

Date: October 21, 2026. Local macOS environment; production Next.js build; Node 24.

## Automated checks

- ESLint and strict TypeScript: passed in final verification.
- Storage unit/integration tests: 12 passed. Includes fresh storage, normalized save, connection reopening, atomic replacement/archive, empty/overlong input rejection, write rollback, competing connections, seven-day clock simulation, HTTP-compatible UUID fallback, database-open failures, aborted reads and subsequent recovery.
- Browser suite: 12/12 passed across Chromium and desktop WebKit, including keyboard entry/focus restoration in both browsers.
- Real process-restart tests close a persistent-profile browser process, launch a new process against the same profile, and retrieve the saved location. These are automated desktop tests, not physical iPhone lifecycle tests.
- Responsive checks: 320, 390, 430, and 1280 CSS pixels; no horizontal overflow on dashboard or manual entry.
- Visual review: phone empty/saved/entry and desktop saved states rendered and inspected. No mock data is preloaded into the application.
- Production dependency audit: `npm audit --omit=dev` reports zero vulnerabilities.

- Production build: passed; home page is statically prerendered, with local data loaded after hydration.

## Dependency limitation

The full audit reports five high-severity **development-only** advisories in the `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces` chain. The current lint package depends on the affected glob parser. npm suggests downgrading the Next lint configuration to an older major; this was not applied. These packages are absent from the production dependency tree. Recheck upstream releases before future dependency updates. Test tools were updated to remove their initial advisories.

## Physical iPhone checklist — NOT performed

Use normal Safari and the same URL throughout. Local-network testing instructions are in README.md. Leave the local server available for every reopen: this milestone does not yet provide an offline shell.

- [ ] Save `2121 Crystal Drive / G1 / F`; refresh; confirm the location is visible immediately after storage loads.
- [ ] Close the tab and Safari; reopen the same URL; confirm the saved location.
- [ ] Restart the iPhone; reopen the same URL; confirm the saved location.
- [ ] Reopen after seven actual days; confirm the saved location. Clock simulation does not establish Safari's real retention behavior.
- [ ] Save a different location; confirm replacement. History is archived internally but not yet browsable in the app.
- [ ] Try an empty/whitespace-only field; confirm no success message and the old location remains.
- [ ] Check small-screen use, software keyboard behavior, safe areas, and VoiceOver labels/reading order.
- [ ] When Milestone 4 is approved and delivered: test Home Screen installation, installed-app restart, persistent-storage requests, and offline launch/retrieval.

Browser storage clearing, eviction, private-browsing restrictions, or an origin change can affect retention. No permanent storage guarantee is made.
