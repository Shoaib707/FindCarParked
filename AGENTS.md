# FindCarParked engineering instructions

Read PRODUCT.md, ROADMAP.md, DECISIONS.md, and README.md before changes. Follow the owner's master requirements: autonomously resolve routine engineering decisions, deliver one milestone at a time, and obtain product-owner approval before starting the next milestone or publicly deploying.

Prioritize durable local parking data above advanced features. Use IndexedDB transactions, validate before writes, archive replacements atomically, retain one active session, never auto-expire data, and confirm commit before announcing success. Preserve existing data on errors. Do not silently delete user data or reset databases during migrations.

Keep data on the device; no accounts, analytics, external photo uploads, paid services, or cloud sync without approval. Do not promise browser storage permanence or unsupported iOS capabilities.

Use strict TypeScript, feature-oriented modules, centralized persistence, and owned UI components. Avoid unnecessary dependencies. Use Node 24 and npm ci. Run npm run check and npm run test:e2e for changes affecting storage and flows. Build before E2E tests. Clearly distinguish automated desktop WebKit from physical iPhone testing. Maintain docs and give a concise milestone delivery report with verification and limitations.

Milestone 1 is authorized. Milestone 2 is pending product-owner approval. Never overwrite unrelated work. Keep Git commits meaningful and work on codex/ branches.
