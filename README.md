# Yearn B2B Partners Dashboard

Marketing site and analytics dashboard for Yearn's partner program. The landing page highlights fees and vault counts, the Team Up form pings a Telegram bot, and partner dashboards (e.g. `/dashboard/0x...treasury`) display balances and payouts pulled via the local API routes.

![](./public/og.png)

- Live site: https://partners.yearn.fi
- Tech: Next.js 16 + TypeScript, TailwindCSS, SWR, Recharts, Framer Motion, Headless UI
- Token/chain icons: loaded from `https://token-assets-one.vercel.app` (see `lib/crypto/tokenLogos.ts` and `next.config.js`)
- Supported chains: Ethereum (1), Base (8453), Arbitrum (42161), Katana (747474)

## Quick start

1. Copy environment defaults: `cp .env.example .env`
2. Install dependencies (pnpm recommended because the lockfile is present): `pnpm install`
3. Run the dev server: `pnpm dev` then open http://localhost:3000
4. Use address 0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde for login testing

Other scripts:
- `pnpm lint` – run ESLint
- `pnpm lintfix` – run ESLint with auto-fix
- `pnpm build` – type-check and build for production
- `pnpm start` – start the built app
- `pnpm export` – generate a static export (if needed)

## Configuration

- Public metadata is set in `pages/_app.tsx` (site name, description, theme color, OG image). Update those values to rebrand the site.
- Runtime environment variables live in `.env`:
  - `YVISION_BASE_URI` – legacy (currently unused; historical Yearn Vision base)
  - `ENVIO_GRAPHQL_URL` – required Envio HyperIndex GraphQL endpoint used by `/api/partner-fees` and `/api/partner-referrals` for multi-chain event data
  - `ENVIO_PASSWORD` – optional Bearer token for authenticated Envio requests
  - `KONG_GRAPHQL_URL` – optional Kong GraphQL endpoint for vault metadata (defaults to https://kong.yearn.fi/api/gql)
  - `RPC_URL_MAINNET_PUBLIC`, `RPC_URL_MAINNET_PRIVATE` – preferred public/latest and private/archive RPCs
  - `RPC_URL_BASE_PUBLIC`, `RPC_URL_BASE_PRIVATE` – preferred public/latest and private/archive RPCs
  - `RPC_URL_ARBITRUM_PUBLIC`, `RPC_URL_ARBITRUM_PRIVATE` – preferred public/latest and private/archive RPCs
  - `RPC_URL_KATANA_PUBLIC`, `RPC_URL_KATANA_PRIVATE` – preferred public/latest and private/archive RPCs
  - `RPC_URL_MAINNET`, `RPC_URL_BASE`, `RPC_URL_ARBITRUM`, `RPC_URL_KATANA` – legacy fallback RPCs if the split envs are unset
  - `NEXTAUTH_SECRET` – secret for NextAuth usage
  - Price data is fetched from DefiLlama (no API key required) to convert non-USD vault values to USD
  - `TELEGRAM_BOT`, `TELEGRAM_RECIPIENT_USERID` – required by `pages/api/telegram.ts` to deliver Team Up form submissions
  - `IP_TO_BLOCK` – optional comma-separated IPs to deny from the contact form
  - `REDIS_URL` – optional Redis URL (e.g. Upstash) for rate limiting contact form submissions (2 submissions per 30 minutes per IP)
  - `CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET` – optional Cloudflare Turnstile CAPTCHA for the contact form

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page with hero, stats (fees + vault count), partner steps, product/vault logo carousels, and target audience cards |
| `/team-up` | Contact form that posts to `/api/telegram`; supports Cloudflare Turnstile CAPTCHA |
| `/faq` | Frequently asked questions about the partner program |
| `/disclaimer` | Legal disclaimer |
| `/dashboard/[partnerID]` | Partner dashboard showing TVL, fees, earnings, per-account breakdown, and profit chart |

## API routes

| Endpoint | Type | Purpose |
|---|---|---|
| `/api/fees` | Edge | Proxies DefiLlama fees summary (30-day total) for the landing page |
| `/api/vault-count` | Edge | Proxies yDaemon to count active V3 vaults for the landing page |
| `/api/vault-asset` | Node | Returns vault asset address metadata (chain ID, vault address, asset address) |
| `/api/partner-tvl` | Node | Returns current vault balances and USD-denominated TVL for given depositor addresses |
| `/api/partner-fees` | Node | Returns fee calculations (gross/net profit, performance fees, chart snapshots) using Envio events + RPC calls |
| `/api/partner-referrals` | Node | Returns dynamic vault/depositor config from Envio ReferralDeposit events for a given referrer address |
| `/api/telegram` | Node | Handles contact form submissions; rate-limited via Redis, supports Turnstile verification |

## Partner dashboards

Partner metadata (name, treasury address, logo) is defined in `utils/Partners.tsx`. The login modal expects a treasury address that maps to an entry in `PARTNERS`; successful login routes to `/dashboard/[partnerID]` where vault balances and payouts are fetched via:
- `/api/partner-tvl`
- `/api/partner-fees` (with optional time-window and chart snapshots)
- `/api/vault-asset` (for vault metadata)

These endpoints aggregate over the vault + depositor configuration in `PARTNER_VAULT_CONFIG` and return normalized totals, asset metadata, and per-account breakdowns.

### Dashboard features

- **Multi-chain, multi-vault support**: Each partner can have vaults across Ethereum, Base, Arbitrum, and Katana, each tracking multiple depositor addresses.
- **Dynamic referral partners**: Partners like Ceazor and Jumper have their vault/depositor config dynamically merged with Envio ReferralDeposit events at runtime, so new depositors are picked up automatically.
- **Vault filtering**: Vaults are checked against Yearn endorsement status and vault-type detection (to exclude strategies from the dropdown). A `VAULT_WHITELIST` allows overriding the strategy filter for specific addresses.
- **Fee calculation**: Fees are computed by replaying deposit/withdraw/transfer events from Envio, fetching historical price-per-share from archive RPCs, and applying the vault's performance fee rate.
- **Time windows**: The dashboard supports 1 week, 1 month, 3 month views (All time is currently disabled).

### Current partners

| Key | Name | Chains |
|---|---|---|
| `yearn` | Yearn (demo) | Ethereum |
| `defisaver` | DeFi Saver | — (no vault config) |
| `ceazor` | Ceazor | Katana (dynamic referrals) |
| `jumper` | Jumper | Katana (dynamic referrals) |
| `aihedge` | AIHedge | Ethereum |
| `frankencoin` | Frankencoin | Ethereum (dynamic ysyBOLD collateral) |

### Adding a new partner

To add a new partner to the dashboard, edit `utils/Partners.tsx` and add entries to two objects:

#### 1. Add partner metadata to `PARTNERS`

```typescript
const PARTNERS: TDict<TPartner> = {
  yearn: { ... },  // existing partner

  // Add your new partner here
  yourpartner: {
    name: 'Your Partner Name',           // Display name
    shortName: 'yourpartner',            // URL-safe identifier (lowercase, no spaces)
    treasury: [toAddress('0xYourPartnerTreasuryAddress')],  // Partner's treasury address(es)
    logo: <LogoYourPartner className={'text-900'} />        // Partner logo component
  }
};
```

The `treasury` address will be used for authentication and URL routing (e.g., `/dashboard/0xYourPartnerTreasuryAddress`).

**Note:** `SHAREABLE_ADDRESSES` is auto-generated from `PARTNERS`, so you don't need to add anything there.

#### 2. Configure vault data in `PARTNER_VAULT_CONFIG`

```typescript
const PARTNER_VAULT_CONFIG: TPartnerVaultConfig = {
  yearn: { ... },  // existing partner

  // Add your new partner's vault configuration
  yourpartner: {
    1: {  // Chain ID (1 = Ethereum, 8453 = Base, 42161 = Arbitrum, 747474 = Katana)
      [toAddress('0xVaultAddress1')]: [  // Yearn V3 vault address
        // List of depositor addresses to track for this vault
        toAddress('0xDepositorAddress1'),
        toAddress('0xDepositorAddress2'),
        toAddress('0xDepositorAddress3')
      ],
      // Add more vaults on the same chain
      [toAddress('0xVaultAddress2')]: [
        toAddress('0xDepositorAddress4'),
        toAddress('0xDepositorAddress5')
      ]
    },
    // Add vaults on other chains
    8453: {  // Base chain
      [toAddress('0xBaseVaultAddress')]: [
        toAddress('0xDepositorAddress6')
      ]
    }
  }
};
```

The dashboard will automatically:
- Query balances and fees for all depositor addresses across all vaults and chains
- Aggregate total TVL and fees across all chains and vaults
- Display the combined metrics on the partner's dashboard

#### 3. Add partner logo component

Create a logo component in `components/icons/partners/` following the existing pattern:

```typescript
// components/icons/partners/LogoYourPartner.tsx
import type {ReactElement} from 'react';

export default function LogoYourPartner({className, isColored}: {className?: string, isColored?: boolean}): ReactElement {
  return (
    <svg className={className} viewBox="0 0 100 100">
      {/* Your SVG logo here */}
    </svg>
  );
}
```

Then import it in `utils/Partners.tsx`:
```typescript
import LogoYourPartner from 'components/icons/partners/LogoYourPartner';
```

And add it to the `LOGOS` object (keyed by `shortName`):
```typescript
const LOGOS: TPartnerLogo = {
  yourpartner: <LogoYourPartner className={'text-900 h-3/4 w-3/4'} />
};
```

#### 4. Dynamic referral tracking (enabled for all partners)

All partners use dynamic referral tracking. The dashboard automatically discovers depositors who deposited through the partner's referral code via Envio's `ReferralDeposit` events emitted by the Yearn referral wrapper contract (`0x3744Df2673097d738aCaa3E463E6D638867757f2` on all supported chains).

Each partner's static `PARTNER_VAULT_CONFIG` (if any) is merged at runtime with data from `/api/partner-referrals`, so no per-partner opt-in is required — just add the partner to `PARTNERS` and `SHAREABLE_ADDRESSES` resolves automatically.

#### 5. Frankencoin (ysyBOLD-as-ZCHF-collateral) tracking

The Frankencoin partner is a special case: instead of a static depositor list or referral events, its tracked "depositors" are the Frankencoin V2 **collateral positions** that hold ysyBOLD (`0x23346B04a7f55b8760E5860AA5A77383D63491cD`, Staked yBOLD) as ZCHF collateral. `/api/partner-referrals` detects the Frankencoin partner (via `SHAREABLE_ADDRESSES`) and queries the Envio indexer's `FrankencoinYsyBoldAccount` ledger (`isPosition = true`) to resolve those position addresses dynamically, returning them against the ysyBOLD vault. The standard `/api/partner-tvl` and `/api/partner-fees` endpoints then compute the balance, profit, and fees on that ysyBOLD collateral using the same Envio endpoint. No `PARTNER_VAULT_CONFIG` entry is required for Frankencoin — positions are discovered automatically as they are opened.

After adding your partner, rebuild the app with `pnpm build` and the new dashboard will be available at:
- `/dashboard/0xYourPartnerTreasuryAddress` (using treasury address)
- Or via the login modal using the treasury address

## Key source files

| Path | Purpose |
|---|---|
| `utils/Partners.tsx` | Partner definitions, vault configs, logos |
| `contexts/usePartner.tsx` | Partner context provider; fetches TVL, fees, endorsements, vault types; merges dynamic referral config |
| `contexts/useAuth.tsx` | Authentication context for the login modal |
| `components/dashboard/DashboardTabsWrapper.tsx` | Main dashboard layout with vault dropdown, time windows, charts, and tables |
| `components/dashboard/SummaryMetrics.tsx` | TVL, fees, earnings, user count metrics display |
| `components/dashboard/AccountFeesTable.tsx` | Per-account fee breakdown table |
| `components/charts/BalanceProfitChart.tsx` | Profit over time chart |
| `lib/crypto/rpc.ts` | RPC URL resolution with chain-specific fallbacks |
| `lib/crypto/defillama.ts` | DefiLlama price fetching |
| `lib/yearn/kong.ts` | Kong GraphQL vault metadata |
| `lib/yearn/endorsement.ts` | Vault endorsement checking |
| `lib/yearn/vaultDetection.ts` | Vault vs strategy detection |

## Known limitations

- Yearn Vision-driven chart aggregation is currently disabled; the large historical chart fetch block in `components/dashboard/DashboardTabsWrapper.tsx` is commented out.
- `usePartner` currently returns an empty `vaults` object (legacy Yearn Vision data path disabled), so per-vault tabs and charts are not populated from that source.
- The dashboard currently relies on the local `/api/partner-tvl`, `/api/partner-fees`, and `/api/vault-asset` routes for totals; these endpoints are the supported path while the legacy Yearn Vision flow is commented out.
- The "All time" time window button is disabled in the dashboard.
- The "Total" vault dropdown option is hidden due to bugs in multi-vault aggregation.
- Archive RPC calls for historical price-per-share can be slow; public fallback RPCs may not support all historical block queries.
