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

### Adding a new partner

To add a new partner to the dashboard, edit `utils/Partners.tsx` and add entries to two objects:

#### 1. Add partner metadata to `PARTNERS`

```typescript
const PARTNERS: TDict<TPartner> = {
  sturdy: { ... },  // existing partner

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
  sturdy: { ... },  // existing partner

  // Add your new partner's vault configuration
  yourpartner: {
    1: {  // Chain ID (1 = Ethereum mainnet, 8453 = Base, 137 = Polygon, etc.)
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

And add it to the `LOGOS` object:
```typescript
const LOGOS: TPartnerLogo = {
  Sturdy: <LogoSturdy isColored={true} className={'text-900 h-3/4 w-3/4'} />,
  'Your Partner Name': <LogoYourPartner isColored={true} className={'text-900 h-3/4 w-3/4'} />
};
```

#### Example: Complete partner configuration

```typescript
// 1. Add to PARTNERS
const PARTNERS: TDict<TPartner> = {
  acme: {
    name: 'Acme Protocol',
    shortName: 'acme',
    treasury: [toAddress('0x1234567890123456789012345678901234567890')],
    logo: <LogoAcme className={'text-900'} />
  }
};

// 2. Add to PARTNER_VAULT_CONFIG
const PARTNER_VAULT_CONFIG: TPartnerVaultConfig = {
  acme: {
    1: {  // Ethereum mainnet
      [toAddress('0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204')]: [  // USDC vault
        toAddress('0xAcmeDepositor1'),
        toAddress('0xAcmeDepositor2')
      ]
    }
  }
};
```

After adding your partner, rebuild the app with `pnpm build` and the new dashboard will be available at:
- `/dashboard/0x1234567890123456789012345678901234567890` (using treasury address)
- Or via the login modal using the treasury address

