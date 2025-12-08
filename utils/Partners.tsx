import LogoSturdy from 'components/icons/partners/LogoSturdy';
import {toAddress} from 'lib/yearn/utils/address';

import type {ReactElement} from 'react';
import type {TPartner} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';

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
	DEFAULT_PROFIT_SHARE
};
