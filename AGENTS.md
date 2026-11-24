# Agent guide

## Project

maiduopin — a Pinduoduo-style WeChat Mini Program marketplace with group buying, bargaining, flash sales and coupons.

## Conventions

- Read the surrounding code before editing.
- Match existing naming, formatting and structure.
- Keep changes small and focused.
- Run the project checks before reporting completion.

## Commands

```bash
npm test               # typecheck + page validation + cover freshness + mock API smoke test
npm run typecheck      # TypeScript only
npm run validate:pages # routes, components and WXML handlers
npm run covers         # regenerate miniprogram/mock/covers.ts
npm run landing        # serve index.html on http://localhost:5173

ntc ran                # default task -> full checks
ntc ran verify         # fast gate: typecheck + page validation
ntc ran checks         # full gate: verify + smoke + covers:check
ntc ran backend        # backend status and the REST contract to implement
ntc ran landing        # preview the landing page
ntc ran list           # available targets
ntc todo               # open tasks
```

`ntc ran <target>` needs a ConPTY shell on Windows — use PowerShell or Windows Terminal, not Git Bash.

## Notes

- Never commit secrets. Local secrets live in `.env` (gitignored).
- SMTP credentials for `ntc smtp` live in `ntc_smtp.json` (gitignored).
- The buyer MVP currently uses `miniprogram/services/mockApi.ts` and local storage.
- Swap `miniprogram/services/api.ts` to the REST client when `server/` is available.
- Product artwork is generated: `miniprogram/mock/covers.ts` is written by `scripts/gen-covers.js`.
  Never hand-edit it; run `npm run covers` instead. `covers:check` fails when it is stale.
- List endpoints return `ProductCard` (no `images`, `skus`, `reviews`, `description`). Only the detail
  page loads the full `Product` — keep it that way so `setData` payloads stay small.
