import LogoDeFiSaver from 'components/icons/partners/LogoDeFiSaver';
import LogoYearn from 'components/icons/LogoYearn';
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
		logo: <img src="/partners/ceazor.jpg" alt="Ceazor" className="text-900" />
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
			],
		}
	},
	defisaver: {
		1: {
			// TODO: Add vault address and depositor addresses for DeFi Saver
			// Example: [toAddress('0xVaultAddress')]: [toAddress('0xDepositorAddress1'), ...]
			[toAddress('0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204')]: [
				toAddress('0xc337C76158c131beDf95a5D4e0C27EC8eFdb7f02'),
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde'),
				toAddress('0xAe7d8Db82480E6d8e3873ecbF22cf17b3D8A7308'),
				toAddress('0x13B053f017B6C68e089267Ffc3f10EE92ED95a79'),
				toAddress('0xA2F263426ef09d43057d6be798A6672A4401ecC5')
			]
		}
	},
	ceazor: {
		1: {
			// TODO: Add vault address and depositor addresses for DeFi Saver
			// Example: [toAddress('0xVaultAddress')]: [toAddress('0xDepositorAddress1'), ...]
			[toAddress('0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204')]: [
				toAddress('0x3c5Aac016EF2F178e8699D6208796A2D67557fe2')
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
	ceazor: <img src="/partners/ceazor.jpg" alt="Ceazor" className="h-3/4 w-3/4 object-contain" />
};

const DEFAULT_PROFIT_SHARE = 0.5;

export {
	LOGOS,
	PARTNERS,
	SHAREABLE_ADDRESSES,
	PARTNER_ADDRESS_GROUPS,
	PARTNER_VAULT_CONFIG,
	DEFAULT_PROFIT_SHARE,
	VAULT_WHITELIST
};
export type {TVaultConfig, TChainConfig, TPartnerVaultConfig};
