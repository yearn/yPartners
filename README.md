# Yearn B2B Partners Dashboard

Marketing site and analytics dashboard for Yearn’s partner program. The landing page highlights fees and vault counts, the Team Up form pings a Telegram bot, and partner dashboards (e.g. `/dashboard/sturdy`) display balances and payouts pulled from Yearn Vision.

![](./public/og.png)

- Live site: https://partners.yearn.fi
- Tech: Next.js 15 + TypeScript, TailwindCSS, SWR, Yearn Web Lib components

## Quick start

1. Copy environment defaults: `cp .env.example .env`
2. Install dependencies (pnpm recommended because the lockfile is present): `pnpm install`
3. Run the dev server: `pnpm dev` then open http://localhost:3000
4. Use address 0xFd1D36995d76c0F75bbe4637C84C06E4A68bBB3a for login testing

Other scripts:
- `pnpm lint` – run ESLint
- `pnpm build` – type-check and build for production
- `pnpm start` – start the built app
- `pnpm export` – generate a static export (if needed)

## Configuration

- Public metadata is set in `next.config.js` (`WEBSITE_NAME`, `WEBSITE_DESCRIPTION`, `WEBSITE_URI`, `PROJECT_GITHUB_URL`, theme color, OG image path). Update those values to rebrand the site.
- Runtime environment variables live in `.env`:
- `YVISION_BASE_URI` – TO BE REMOVED – base API for partner balances/payouts (defaults to https://api.yearn.vision in config)
  - `RPC_URL_MAINNET` / `WS_URL_MAINNET` – Ethereum RPC endpoints used by the Yearn provider
  - `NEXTAUTH_SECRET` – secret for NextAuth usage
  - `TELEGRAM_BOT`, `TELEGRAM_RECIPIENT_USERID` – required by `pages/api/telegram.ts` to deliver Team Up form submissions
  - `IP_TO_BLOCK` – optional comma-separated IPs to deny from the contact form

## Partner dashboards

Partner metadata (name, treasury address, logo) is defined in `utils/Partners.tsx`. The login modal expects a treasury address that maps to an entry in `PARTNERS`; successful login routes to `/dashboard/[partnerID]` where vault balances and payouts are fetched from Yearn Vision.
