import	LogoAlchemix			from	'components/icons/partners/LogoAlchemix';
import	LogoElement				from	'components/icons/partners/LogoElement';
import	LogoGearbox				from	'components/icons/partners/LogoGearbox';
import	LogoInverse				from	'components/icons/partners/LogoInverse';
import	LogoLedger				from	'components/icons/partners/LogoLedger';
import	LogoMIM					from	'components/icons/partners/LogoMIM';
import	LogoQiDAO				from	'components/icons/partners/LogoQiDAO';
import	LogoSpool				from	'components/icons/partners/LogoSpool';
import	LogoZooDao				from	'components/icons/partners/LogoZooDAO';

import type {ReactElement} from 'react';
import	type {TPartnerList}		from	'types/types';

const	PARTNERS: TPartnerList[] = [
	{
		name: 'QiDAO',
		shortName: 'qidao',
		description: 'A stablecoin protocol utilizing collateralized debt positions',
		logo: <LogoQiDAO className={'text-900'} />
	}, {
		name: 'Element Finance',
		shortName: 'element',
		description: 'An open source protocl for fixed and variable yield markets',
		logo: <LogoElement className={'text-900'} />
	}, {
		name: 'Spool',
		shortName: 'spool',
		description: 'A non-custodial permissionless middleware that allows users to earn DeFi returns',
		logo: <LogoSpool className={'text-900'} />
	}, {
		name: 'Abracadabra',
		shortName: 'abracadabra',
		description: 'A decentralized crypto lending platform ',
		logo: <LogoMIM className={'text-900'} />
	}, {
		name: 'Ledger',
		shortName: 'ledger',
		description: 'An application to quickly and securely manage their assets',
		logo: <LogoLedger className={'text-900'} />
	}, {
		name: 'Alchemix',
		shortName: 'alchemix',
		description: 'Self-repaying loans without risk of liquidation',
		logo: <LogoAlchemix className={'text-900'} />
	}, {
		name: 'Gearbox',
		shortName: 'gearbox',
		description: 'A generalized leverage protocol',
		logo: <LogoGearbox className={'text-900'} />
	}, {
		name: 'Inverse Finance',
		shortName: 'inverse',
		description: 'An open source protocol for borrowing and lending assets',
		logo: <LogoInverse className={'text-900'} />
	}, {
		name: 'ZooDAO',
		shortName: 'zoodao',
		description: 'A platform that allows users to earn passive income from NFTs',
		logo: <LogoZooDao className={'text-900'} />
	}

];

const PARTNER_SHORT_NAMES: {[key: string]: string} = {
	'QiDAO': 'qidao',
	'Element Finance': 'element',
	'Abracadabra': 'abracadabra',
	'Ledger': 'ledger',
	'Alchemix': 'alchemix',
	'Gearbox': 'gearbox',
	'Inverse Finance': 'inverse',
	'ZooDAO': 'zoodao' //*
};

type TPartnerLogo = {
	[key: string]: ReactElement
}

const LOGOS: TPartnerLogo = {
	'QiDAO': <LogoQiDAO className={'text-900 h-3/4 w-3/4'} />,
	'Element Finance': <LogoElement className={'text-900 h-3/4 w-3/4'} />,
	'Spool': <LogoSpool className={'text-900 h-3/4 w-3/4'} />,
	'Abracadabra': <LogoMIM className={'text-900 h-3/4 w-3/4'} />,
	'Ledger': <LogoLedger className={'text-900 h-3/4 w-3/4'} />,
	'Alchemix': <LogoAlchemix className={'text-900 h-3/4 w-3/4'} />,
	'Gearbox': <LogoGearbox className={'text-900 h-3/4 w-3/4'} />,
	'Inverse Finance': <LogoInverse className={'text-900 h-3/4 w-3/4'} />,
	'ZooDAO': <LogoZooDao className={'text-900 h-3/4 w-3/4'} />
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
	LOGOS, PARTNER_SHORT_NAMES, PARTNERS, PROFIT_SHARE_TEIRS
};
