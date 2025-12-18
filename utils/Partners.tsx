import LogoSturdy from 'components/icons/partners/LogoSturdy';
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
	}
};

const SHAREABLE_ADDRESSES: {[key: string]: {name: string, shortName: string}} = {
	[toAddress('0xFd1D36995d76c0F75bbe4637C84C06E4A68bBB3a')]: {name: 'Sturdy', shortName: 'sturdy'}
};

const PARTNER_ADDRESS_GROUPS: {[key: string]: TAddress[]} = {
	sturdy: [
		toAddress('0xc337C76158c131beDf95a5D4e0C27EC8eFdb7f02'),
		toAddress('0x93A62dA5a14C80f265DAbC077fCEE437B1a0Efde'),
		toAddress('0xAe7d8Db82480E6d8e3873ecbF22cf17b3D8A7308'),
		toAddress('0x13B053f017B6C68e089267Ffc3f10EE92ED95a79'),
		toAddress('0xA2F263426ef09d43057d6be798A6672A4401ecC5')
	]
};

type TPartnerLogo = {
	[key: string]: ReactElement;
}

const LOGOS: TPartnerLogo = {
	Sturdy: <LogoSturdy isColored={true} className={'text-900 h-3/4 w-3/4'} />
};

const DEFAULT_PROFIT_SHARE = 0.5;

export {
	LOGOS,
	PARTNERS,
	SHAREABLE_ADDRESSES,
	PARTNER_ADDRESS_GROUPS,
	DEFAULT_PROFIT_SHARE
};
