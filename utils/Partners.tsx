import LogoSturdy from 'components/icons/partners/LogoSturdy';
import LogoDeFiSaver from 'components/icons/partners/LogoDeFiSaver';
import {toAddress} from 'lib/yearn/utils/address';

import type {ReactElement} from 'react';
import type {TPartner} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';
import type {TAddress} from 'lib/yearn/utils/address';

const PARTNERS: TDict<TPartner> = {
	sturdy: {
		name: 'Sturdy',
		shortName: 'sturdy',
		treasury: [toAddress('0xFd1D36995d76c0F75bbe4637C84C06E4A68bBB3a')],
		logo: <LogoSturdy className={'text-900'} />
	},
	defisaver: {
		name: 'DeFi Saver',
		shortName: 'defisaver',
		treasury: [toAddress('0x81cA52CfE66421d0ceF82d5F33230e43b5F23D2B')],
		logo: <LogoDeFiSaver className={'text-900'} />
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

const PARTNER_VAULT_CONFIG: TPartnerVaultConfig = {
	sturdy: {
		1: {
			[toAddress('0xBe53A109B494E5c9f97b9Cd39Fe969BE68BF6204')]: [
				toAddress('0xc337C76158c131beDf95a5D4e0C27EC8eFdb7f02'),
				toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde'),
				toAddress('0xAe7d8Db82480E6d8e3873ecbF22cf17b3D8A7308'),
				toAddress('0x13B053f017B6C68e089267Ffc3f10EE92ED95a79'),
				toAddress('0xA2F263426ef09d43057d6be798A6672A4401ecC5')
			]
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
	Sturdy: <LogoSturdy isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'DeFi Saver': <LogoDeFiSaver isColored={true} className={'text-900 h-3/4 w-3/4'} />
};

const DEFAULT_PROFIT_SHARE = 0.5;

export {
	LOGOS,
	PARTNERS,
	SHAREABLE_ADDRESSES,
	PARTNER_ADDRESS_GROUPS,
	PARTNER_VAULT_CONFIG,
	DEFAULT_PROFIT_SHARE
};
export type {TVaultConfig, TChainConfig, TPartnerVaultConfig};
