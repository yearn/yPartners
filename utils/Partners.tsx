import LogoDeFiSaver from 'components/icons/partners/LogoDeFiSaver';
import LogoYearn from 'components/icons/LogoYearn';
import LogoFrankencoin from 'components/icons/partners/LogoFrankencoin';
import {toAddress} from 'lib/yearn/utils/address';

import type {ReactElement} from 'react';
import type {TPartner} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';
import type {TAddress} from 'lib/yearn/utils/address';

const PARTNERS: TDict<TPartner> = {
	yearn: {
		name: 'Yearn (demo)',
		shortName: 'yearn',
		treasury: [toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')],
		logo: <LogoYearn className={'text-900'} />
	},
	defisaver: {
		name: 'DeFi Saver',
		shortName: 'defisaver',
		treasury: [toAddress('0x81cA52CfE66421d0ceF82d5F33230e43b5F23D2B')],
		logo: <LogoDeFiSaver className={'text-900'} />
	},
	ceazor: {
		name: 'Ceazor',
		shortName: 'ceazor',
		treasury: [toAddress('0x8244F0746396E06bD26F68C00E9b48b70b771472')],
		feeStartDate: '2026-03-14',
		logo: <img src="/partners/ceazor.jpg" alt="Ceazor" className="text-900" />
	},
	jumper: {
		name: 'Jumper',
		shortName: 'jumper',
		treasury: [toAddress('0x3610486BD4975F5C3dC838A36E897bF97fAE15DD')],
		feeStartDate: '2026-03-24',
		logo: <img src="/partners/jumper.jpg" alt="Jumper" className="text-900" />
	},
	aihedge: {
		name: 'AIHedge',
		shortName: 'aihedge',
		treasury: [toAddress('0x241ac8b7584dfe2f23b626c939fd88b9151d7684')],
		feeStartDate: '2026-06-17',
		logo: <img src="/partners/aihedge.jpg" alt="AIHedge" className="text-900" />
	},
	frankencoin: {
		name: 'Frankencoin',
		shortName: 'frankencoin',
		// Frankencoin V2 MintingHub (0xDe12B…3557): the contract that opens positions
		// using ysyBOLD as ZCHF collateral. Used as the routing/login identifier only;
		// the tracked depositors (the ysyBOLD collateral positions) are resolved
		// dynamically from the Envio indexer by /api/partner-referrals.
		treasury: [toAddress('0xDe12B620A8a714476A97EfD14E6F7180Ca653557')],
		feeStartDate: '2026-07-24',
		logo: <LogoFrankencoin className={'text-900'} />
	},
	alchemix: {
		name: 'Alchemix',
		shortName: 'alchemix',
		treasury: [toAddress('0x29bcfeD246ce37319d94eBa107db90C453D4c43D')],
		feeStartDate: '2026-07-29',
		logo: <img src="/partner-logos/AlchemixMark_01.svg" alt="Alchemix" className="text-900" />
	}
};

// Auto-generate SHAREABLE_ADDRESSES from PARTNERS
// This maps treasury addresses to partner info for URL routing
const SHAREABLE_ADDRESSES: {[key: string]: {name: string, shortName: string}} = Object.entries(PARTNERS).reduce(
	(acc, [, partner]) => {
		if (partner.treasury) {
			partner.treasury.forEach((treasuryAddress) => {
				acc[treasuryAddress] = {
					name: partner.name,
					shortName: partner.shortName
				};
			});
		}
		return acc;
	},
	{} as {[key: string]: {name: string, shortName: string}}
);

type TVaultConfig = {
	[vaultAddress: string]: TAddress[];
};

type TChainConfig = {
	[chainId: number]: TVaultConfig;
};

type TPartnerVaultConfig = {
	[partnerKey: string]: TChainConfig;
};

// Vault whitelist: addresses that should NOT be filtered out as strategies
// Format: {chainId: [address1, address2, ...]} - addresses in lowercase
const VAULT_WHITELIST: Record<number, string[]> = {
	1: [toAddress('0x23346B04a7f55b8760E5860AA5A77383D63491cD')].map((a) => a.toLowerCase())
};

const PARTNER_VAULT_CONFIG: TPartnerVaultConfig = {
	yearn: {
		1: {
			// Example: [toAddress('0xVaultAddress')]: [toAddress('0xDepositorAddress1'), ...]
			[toAddress('0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			],
			[toAddress('0x028eC7330ff87667b6dfb0D94b954c820195336c')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			],
			[toAddress('0xAe7d8Db82480E6d8e3873ecbF22cf17b3D8A7308')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			],
			[toAddress('0xAc37729B76db6438CE62042AE1270ee574CA7571')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			],
			[toAddress('0x92545bCE636E6eE91D88D2D017182cD0bd2fC22e')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			],
			[toAddress('0xBF319dDC2Edc1Eb6FDf9910E39b37Be221C8805F')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			],
			[toAddress('0xc56413869c6CDf96496f2b1eF801fEDBdFA7dDB0')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			],
			[toAddress('0x182863131F9a4630fF9E27830d945B1413e347E8')]: [
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde')
			]
		}
	},
	jumper: {
		747474: {
			// Example: [toAddress('0xVaultAddress')]: [toAddress('0xDepositorAddress1'), ...]
			[toAddress('0xE007CA01894c863d7898045ed5A3B4Abf0b18f37')]: [
				toAddress('0x3610486BD4975F5C3dC838A36E897bF97fAE15DD')
			],
			[toAddress('0x80c34BD3A3569E126e7055831036aa7b212cB159')]: [
				toAddress('0x3610486BD4975F5C3dC838A36E897bF97fAE15DD')
			],
			[toAddress('0x9A6bd7B6Fd5C4F87eb66356441502fc7dCdd185B')]: [
				toAddress('0x3610486BD4975F5C3dC838A36E897bF97fAE15DD')
			],
			[toAddress('0xAa0362eCC584B985056E47812931270b99C91f9d')]: [
				toAddress('0x3610486BD4975F5C3dC838A36E897bF97fAE15DD')
			],
			[toAddress('0x93Fec6639717b6215A48E5a72a162C50DCC40d68')]: [
				toAddress('0x3610486BD4975F5C3dC838A36E897bF97fAE15DD')
			]
		}
	},
	aihedge: {
		1: {
			// Example: [toAddress('0xVaultAddress')]: [toAddress('0xDepositorAddress1'), ...]
			[toAddress('0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204')]: [
				toAddress('0x241ac8b7584dfe2f23b626c939fd88b9151d7684')
			]
		}
	},
	alchemix: {
		// Alchemix deposits directly into endorsed Yearn v3 vaults and receives the
		// yv-shares itself (owner == sender in every Deposit event), so these are
		// plain ERC4626 deposits fully indexed by `owner` in Envio. The standard
		// partner-tvl / partner-fees pipeline tracks them with no referral wrapper
		// or custom indexing required.
		1: {
			// yvWETH — depositor 0x8AAC…
			[toAddress('0xc56413869c6CDf96496f2b1eF801fEDBdFA7dDB0')]: [
				toAddress('0x8AACC947c2f4E24D2Be4CBa4498f004079F35D87')
			],
			// yvUSDC — depositor 0xdFDC… (performance fee not yet active on this vault)
			[toAddress('0x696d02Db93291651ED510704c9b286841d506987')]: [
				toAddress('0xdFDC17F784e16D7634AC270911D98755C68Ae220')
			]
		}
	}
};

// Backward compatibility: Flatten the structure for components that still use the old format
const PARTNER_ADDRESS_GROUPS: {[key: string]: TAddress[]} = Object.entries(PARTNER_VAULT_CONFIG).reduce(
	(acc, [partnerKey, chains]) => {
		const allAddresses: TAddress[] = [];
		Object.values(chains).forEach((vaults) => {
			Object.values(vaults).forEach((addresses) => {
				allAddresses.push(...addresses);
			});
		});
		acc[partnerKey] = allAddresses;
		return acc;
	},
	{} as {[key: string]: TAddress[]}
);

type TPartnerLogo = {
	[key: string]: ReactElement;
}

const LOGOS: TPartnerLogo = {
	yearn: <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	defisaver: <LogoDeFiSaver isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	ceazor: <img src="/partners/ceazor.jpg" alt="Ceazor" className="h-3/4 w-3/4 object-contain" />,
	jumper: <img src="/partners/jumper.jpg" alt="Jumper" className="h-3/4 w-3/4 object-contain" />,
	aihedge: <img src="/partners/aihedge.jpg" alt="AIHedge" className="h-3/4 w-3/4 object-contain" />,
	frankencoin: <LogoFrankencoin isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	alchemix: <img src="/partner-logos/AlchemixMark_01.svg" alt="Alchemix" className="h-3/4 w-3/4 object-contain" />
};

const DEFAULT_PROFIT_SHARE = 0.5;

// Date from which fee splitting/accrual begins for a partner. Deposits and
// vault activity before this date are visible on the chart but earn no fees.
// TESTING: applied to every partner; override per partner via TPartner.feeStartDate.
const DEFAULT_FEE_START_DATE = '2026-07-15';

export {
	LOGOS,
	PARTNERS,
	DEFAULT_FEE_START_DATE,
	SHAREABLE_ADDRESSES,
	PARTNER_ADDRESS_GROUPS,
	PARTNER_VAULT_CONFIG,
	DEFAULT_PROFIT_SHARE,
	VAULT_WHITELIST
};
export type {TVaultConfig, TChainConfig, TPartnerVaultConfig};
