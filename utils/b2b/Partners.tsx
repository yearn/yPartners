import LogoYearn from 'components/icons/LogoYearn';
import	LogoAlchemix			from	'components/icons/partners/LogoAlchemix';
import	LogoBadger				from	'components/icons/partners/LogoBadger';
import	LogoBeethoven			from	'components/icons/partners/LogoBeethoven';
import	LogoElement				from	'components/icons/partners/LogoElement';
import	LogoGearbox				from	'components/icons/partners/LogoGearbox';
import	LogoInverse				from	'components/icons/partners/LogoInverse';
import	LogoLedger				from	'components/icons/partners/LogoLedger';
import	LogoMIM					from	'components/icons/partners/LogoMIM';
import	LogoMover				from	'components/icons/partners/LogoMover';
import	LogoPhuture				from	'components/icons/partners/LogoPhuture';
import	LogoPickle				from	'components/icons/partners/LogoPickle';
import	LogoQiDAO				from	'components/icons/partners/LogoQiDAO';
import	LogoRhino				from	'components/icons/partners/LogoRhino';
import	LogoSpool				from	'components/icons/partners/LogoSpool';
import	LogoSturdy				from	'components/icons/partners/LogoSturdy';

import type {ReactElement} from 'react';
import	type {TPartner}		from	'types/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';

const	PARTNERS: TDict<TPartner> = {
	'qidao' : {
		name: 'QiDAO',
		shortName: 'qidao',
		treasury: ['0x679016B3F8E98673f85c6F72567f22b58Aa15A54'],
		logo: <LogoQiDAO className={'text-900'} />
	},
	'element':  {
		name: 'Element Finance',
		shortName: 'element',
		treasury: ['0x82eF450FB7f06E3294F2f19ed1713b255Af0f541'],
		logo: <LogoElement className={'text-900'} />
	},
	'spoolfi':  {
		name: 'SpoolFi',
		shortName: 'spoolfi',
		treasury: ['0xF6Bc2E3b1F939C435D9769D078a6e5048AaBD463'],
		logo: <LogoSpool className={'text-900'} />
	},
	'abracadabra':  {
		name: 'Abracadabra.Money',
		shortName: 'abracadabra',
		treasury: ['0xDF2C270f610Dc35d8fFDA5B453E74db5471E126B', '0x5A7C5505f3CFB9a0D9A8493EC41bf27EE48c406D'],
		logo: <LogoMIM className={'text-900'} />
	},
	'ledger':  {
		name: 'Ledger',
		shortName: 'ledger',
		treasury: ['0x558247e365be655f9144e1a0140D793984372Ef3'],
		logo: <LogoLedger className={'text-900'} />
	},
	'alchemix':  {
		name: 'Alchemix Finance',
		shortName: 'alchemix',
		treasury: ['0x8392F6669292fA56123F71949B52d883aE57e225', '0x6b291CF19370A14bbb4491B01091e1E29335e605'],
		logo: <LogoAlchemix className={'text-900'} />
	},
	'gearbox':  {
		name: 'Gearbox',
		shortName: 'gearbox',
		treasury: ['0x7b065Fcb0760dF0CEA8CFd144e08554F3CeA73D1'],
		logo: <LogoGearbox className={'text-900'} />
	},
	'inverse':  {
		name: 'Inverse Finance',
		shortName: 'inverse',
		treasury: ['0x926dF14a23BE491164dCF93f4c468A50ef659D5B'],
		logo: <LogoInverse className={'text-900'} />
	},
	'pickle':  {
		name: 'Pickle Finance',
		shortName: 'pickle',
		treasury: ['0x066419EaEf5DE53cc5da0d8702b990c5bc7D1AB3'],
		logo: <LogoPickle className={'text-900'} />
	},
	'phuture':  {
		name: 'Phuture',
		shortName: 'phuture',
		treasury: ['0x237a4d2166Eb65cB3f9fabBe55ef2eb5ed56bdb9'],
		logo: <LogoPhuture className={'text-900'} />
	},
	'yieldster':  {
		name: 'Yieldster',
		shortName: 'yieldster',
		treasury: ['0x2955278aBCE187315D6d72B0d626f1217786DF60'],
		logo: <LogoYearn className={'text-900'} />
	},
	'chfry':  {
		name: 'Cheese Fry Finance',
		shortName: 'chfry',
		treasury: ['0x3400985be0b41Ce9778823E9618074115f830799'],
		logo: <LogoYearn className={'text-900'} />
	},
	'popcorndao':  {
		name: 'Popcorn DAO',
		shortName: 'popcorndao',
		treasury: ['0x403d41e72308b5D89a383C3F6789EDD7D3576Ee0'],
		logo: <LogoYearn className={'text-900'} />
	},
	'deus':  {
		name: 'DEUS Finance DAO',
		shortName: 'deus',
		treasury: ['0x4e8a7C429192bFDa8c9a1ef0f3B749d0f66657AA'],
		logo: <LogoYearn className={'text-900'} />
	},
	'rhino.fi':  {
		name: 'rhino.fi',
		shortName: 'rhino.fi',
		treasury: ['0x520Cf70a2D0B3dfB7386A2Bc9F800321F62a5c3a'],
		logo: <LogoRhino className={'text-900'} />
	},
	'wido':  {
		name: 'Wido',
		shortName: 'wido',
		treasury: ['0x5EF7F250f74d4F11A68054AE4e150705474a6D4a'],
		logo: <LogoYearn className={'text-900'} />
	},
	'gb':  {
		name: 'gb',
		shortName: 'gb',
		treasury: ['0x6965292e29514e527df092659FB4638dc39e7248'],
		logo: <LogoYearn className={'text-900'} />
	},
	'basketdao':  {
		name: 'BasketDAO',
		shortName: 'basketdao',
		treasury: ['0x7301C46be73bB04847576b6Af107172bF5e8388e'],
		logo: <LogoYearn className={'text-900'} />
	},
	'frax':  {
		name: 'Frax Finance',
		shortName: 'frax',
		treasury: ['0x8d0C5D009b128315715388844196B85b41D9Ea30'],
		logo: <LogoYearn className={'text-900'} />
	},
	'shapeshiftdao':  {
		name: 'ShapeShift DAO',
		shortName: 'shapeshiftdao',
		treasury: ['0x90A48D5CF7343B08dA12E067680B4C6dbfE551Be'],
		logo: <LogoYearn className={'text-900'} />
	},
	'cofi':  {
		name: 'CoFi',
		shortName: 'cofi',
		treasury: ['0x982646BA80a706B402Bf6e286A815c06f5b71129'],
		logo: <LogoYearn className={'text-900'} />
	},
	'donutapp':  {
		name: 'Donut',
		shortName: 'donutapp',
		treasury: ['0x9eaCFF404BAC19195CbD131a4BeA880Abd09B35e'],
		logo: <LogoYearn className={'text-900'} />
	},
	'ambire':  {
		name: 'Ambire Wallet',
		shortName: 'ambire',
		treasury: ['0xa07D75aacEFd11b425AF7181958F0F85c312f143'],
		logo: <LogoYearn className={'text-900'} />
	},
	'tempus':  {
		name: 'Tempus',
		shortName: 'tempus',
		treasury: ['0xaB40A7e3cEF4AfB323cE23B6565012Ac7c76BFef', '0x51252c520375C6A236Bb56DdF0C407A099B2EC0e'],
		logo: <LogoYearn className={'text-900'} />
	},
	'akropolis':  {
		name: 'Akropolis',
		shortName: 'akropolis',
		treasury: ['0xC5aF91F7D10dDe118992ecf536Ed227f276EC60D'],
		logo: <LogoYearn className={'text-900'} />
	},
	'badger':  {
		name: 'BadgerDAO',
		shortName: 'badger',
		treasury: ['0xD0A7A8B98957b9CD3cFB9c0425AbE44551158e9e'],
		logo: <LogoBadger className={'text-900'} />
	},
	'coinomo':  {
		name: 'Coinomo',
		shortName: 'coinomo',
		treasury: ['0xd3877D9df3Cb52006b7d932e8Db4B36E22e89242'],
		logo: <LogoYearn className={'text-900'} />
	},
	'mover':  {
		name: 'Mover',
		shortName: 'mover',
		treasury: ['0xf6A0307cb6aA05D7C19d080A0DA9B14eAB1050b7'],
		logo: <LogoMover className={'text-900'} />
	},
	'beethovenx':  {
		name: 'Beethoven X',
		shortName: 'beethovenx',
		treasury: ['0xa1E849B1d6c2Fd31c63EEf7822e9E0632411ada7'],
		logo: <LogoBeethoven className={'text-900'} />
	},
	'sturdy':  {
		name: 'Sturdy',
		shortName: 'sturdy',
		treasury: ['0xFd1D36995d76c0F75bbe4637C84C06E4A68bBB3a'],
		logo: <LogoSturdy className={'text-900'} />
	},
	'yapeswap':  {
		name: 'yApeSwap',
		shortName: 'yapeswap',
		treasury: ['0x10DE513EE154BfA97f1c2841Cab91E8C389c7c72'],
		logo: <LogoYearn className={'text-900'} />
	}
};


type TPartnerLogo = {
	[key: string]: ReactElement
}

const LOGOS: TPartnerLogo = {
	'QiDAO': <LogoQiDAO isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Element Finance': <LogoElement isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'SpoolFi': <LogoSpool isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Abracadabra.Money': <LogoMIM className={'text-900 h-3/4 w-3/4'} />,
	'Ledger': <LogoLedger isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Alchemix Finance': <LogoAlchemix className={'text-900 h-3/4 w-3/4'} />,
	'Gearbox': <LogoGearbox className={'text-900 h-3/4 w-3/4'} />,
	'Inverse Finance': <LogoInverse isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Pickle Finance': <LogoPickle isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Phuture': <LogoPhuture isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Yieldster': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Cheese Fry Finance': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	// 'Popcorn DAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'DEUS Finance DAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'rhino.fi': <LogoRhino isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Wido': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'gb': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'BasketDAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	// 'Frax Finance': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	// 'ShapeShift DAO': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'CoFi': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	// 'Donut': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	// 'Ambire Wallet': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Tempus': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	// 'Akropolis': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'BadgerDAO': <LogoBadger isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Coinomi': <LogoYearn className={'text-900 h-3/4 w-3/4'} />,
	'Mover': <LogoMover isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Beethoven X': <LogoBeethoven isColored={true} className={'text-900 h-3/4 w-3/4'} />,
	'Sturdy': <LogoSturdy isColored={true} className={'text-900 h-3/4 w-3/4'} />,
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
