import LogoYearn from 'components/icons/LogoYearn';
import	LogoAlchemix			from	'components/icons/partners/LogoAlchemix';
import	LogoElement				from	'components/icons/partners/LogoElement';
import	LogoGearbox				from	'components/icons/partners/LogoGearbox';
import	LogoInverse				from	'components/icons/partners/LogoInverse';
import	LogoLedger				from	'components/icons/partners/LogoLedger';
import	LogoMIM					from	'components/icons/partners/LogoMIM';
import	LogoQiDAO				from	'components/icons/partners/LogoQiDAO';
import	LogoSpool				from	'components/icons/partners/LogoSpool';

import type {ReactElement} from 'react';
import	type {TPartner}		from	'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

const	PARTNERS: TDict<TPartner> = {
	'qidao' : {
		name: 'QiDAO',
		shortName: 'qidao',
		logo: <LogoQiDAO className={'text-900'} />
	},
	'element':  {
		name: 'Element Finance',
		shortName: 'element',
		logo: <LogoElement className={'text-900'} />
	},
	'spoolfi':  {
		name: 'SpoolFi',
		shortName: 'spoolfi',
		logo: <LogoSpool className={'text-900'} />
	},
	'abracadabra':  {
		name: 'Abracadabra.Money',
		shortName: 'abracadabra',
		logo: <LogoMIM className={'text-900'} />
	},
	'ledger':  {
		name: 'Ledger',
		shortName: 'ledger',
		logo: <LogoLedger className={'text-900'} />
	},
	'alchemix':  {
		name: 'Alchemix Finance',
		shortName: 'alchemix',
		logo: <LogoAlchemix className={'text-900'} />
	},
	'gearbox':  {
		name: 'Gearbox',
		shortName: 'gearbox',
		logo: <LogoGearbox className={'text-900'} />
	},
	'inverse':  {
		name: 'Inverse Finance',
		shortName: 'inverse',
		logo: <LogoInverse className={'text-900'} />
	},
	'pickle':  {
		name: 'Pickle Finance',
		shortName: 'pickle',
		logo: <LogoYearn className={'text-900'} />
	},
	'phuture':  {
		name: 'Phuture',
		shortName: 'phuture',
		logo: <LogoYearn className={'text-900'} />
	},
	'yieldster':  {
		name: 'Yieldster',
		shortName: 'yieldster',
		logo: <LogoYearn className={'text-900'} />
	},
	'chfry':  {
		name: 'Cheese Fry Finance',
		shortName: 'chfry',
		logo: <LogoYearn className={'text-900'} />
	},
	'popcorndao':  {
		name: 'Popcorn DAO',
		shortName: 'popcorndao',
		logo: <LogoYearn className={'text-900'} />
	},
	'deus':  {
		name: 'DEUS Finance DAO',
		shortName: 'deus',
		logo: <LogoYearn className={'text-900'} />
	},
	'rhino.fi':  {
		name: 'rhino.fi',
		shortName: 'rhino.fi',
		logo: <LogoYearn className={'text-900'} />
	},
	'wido':  {
		name: 'Wido',
		shortName: 'wido',
		logo: <LogoYearn className={'text-900'} />
	},
	'gb':  {
		name: 'gb',
		shortName: 'gb',
		logo: <LogoYearn className={'text-900'} />
	},
	'basketdao':  {
		name: 'BasketDAO',
		shortName: 'basketdao',
		logo: <LogoYearn className={'text-900'} />
	},
	'frax':  {
		name: 'Frax Finance',
		shortName: 'frax',
		logo: <LogoYearn className={'text-900'} />
	},
	'shapeshiftdao':  {
		name: 'ShapeShift DAO',
		shortName: 'shapeshiftdao',
		logo: <LogoYearn className={'text-900'} />
	},
	'cofi':  {
		name: 'CoFi',
		shortName: 'cofi',
		logo: <LogoYearn className={'text-900'} />
	},
	'donutapp':  {
		name: 'Donut',
		shortName: 'donutapp',
		logo: <LogoYearn className={'text-900'} />
	},
	'ambire':  {
		name: 'Ambire Wallet',
		shortName: 'ambire',
		logo: <LogoYearn className={'text-900'} />
	},
	'tempus':  {
		name: 'Tempus',
		shortName: 'tempus',
		logo: <LogoYearn className={'text-900'} />
	},
	'akropolis':  {
		name: 'Akropolis',
		shortName: 'akropolis',
		logo: <LogoYearn className={'text-900'} />
	},
	'badger':  {
		name: 'BadgerDAO',
		shortName: 'badger',
		logo: <LogoYearn className={'text-900'} />
	},
	'coinomo':  {
		name: 'Coinomo',
		shortName: 'coinomo',
		logo: <LogoYearn className={'text-900'} />
	},
	'mover':  {
		name: 'Mover',
		shortName: 'mover',
		logo: <LogoYearn className={'text-900'} />
	},
	'beethovenx':  {
		name: 'Beethoven X',
		shortName: 'beethovenx',
		logo: <LogoYearn className={'text-900'} />
	},
	'sturdy':  {
		name: 'Sturdy',
		shortName: 'sturdy',
		logo: <LogoYearn className={'text-900'} />
	},
	'yapeswap':  {
		name: 'yApeSwap',
		shortName: 'yapeswap',
		logo: <LogoYearn className={'text-900'} />
	}
};


type TPartnerLogo = {
	[key: string]: ReactElement
}

const LOGOS: TPartnerLogo = {
	'QiDAO': <LogoQiDAO className={'text-900 h-3/4 w-3/4'} />,
	'Element Finance': <LogoElement className={'text-900 h-3/4 w-3/4'} />,
	'SpoolFi': <LogoSpool className={'text-900 h-3/4 w-3/4'} />,
	'Abracadabra.Money': <LogoMIM className={'text-900 h-3/4 w-3/4'} />,
	'Ledger': <LogoLedger className={'text-900 h-3/4 w-3/4'} />,
	'Alchemix Finance': <LogoAlchemix className={'text-900 h-3/4 w-3/4'} />,
	'Gearbox': <LogoGearbox className={'text-900 h-3/4 w-3/4'} />,
	'Inverse Finance': <LogoInverse className={'text-900 h-3/4 w-3/4'} />,
	'Pickle Finance': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Phuture': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Yieldster': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Cheese Fry Finance': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Popcorn DAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'DEUS Finance DAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'rhino.fi': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Wido': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'gb': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'BasketDAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Frax Finance': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'ShapeShift DAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'CoFi': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Donut': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Ambire Wallet': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Tempus': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Akropolis': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'BadgerDAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Coinomi': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Mover': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Beethoven X': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Sturdy': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'yApeSwap': <LogoYearn className={'text-900 h-3/4 w-3/4'} />
};


type TProfitShareTier = {
	[key: string]: number
}

const PROFIT_SHARE_TEIRS: TProfitShareTier = {
	'0'  : 999999,
	'10' : 1000000,
	'15' : 5000000,
	'20' : 10000000,
	'25' : 50000000,
	'30' : 100000000,
	'35' : 200000000,
	'40' : 400000000,
	'45' : 700000000,
	'50' : 1000000000

};

export {
	LOGOS, PARTNERS, PROFIT_SHARE_TEIRS
};
