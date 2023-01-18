import	LogoAlchemix			from	'components/icons/partners/LogoAlchemix';
import	LogoBrave				from	'components/icons/partners/LogoBrave';
import	LogoElement				from	'components/icons/partners/LogoElement';
import	LogoGearbox				from	'components/icons/partners/LogoGearbox';
import	LogoInverse				from	'components/icons/partners/LogoInverse';
import	LogoLedger				from	'components/icons/partners/LogoLedger';
import	LogoMIM					from	'components/icons/partners/LogoMIM';
import	LogoQiDAO				from	'components/icons/partners/LogoQiDAO';
import	LogoZooDao				from	'components/icons/partners/LogoZooDAO';

import type {ReactElement} from 'react';
import	type {TPartnerList}		from	'types/types';

const	PARTNERS: TPartnerList[] = [
	{
		name: 'QiDAO',
		description: 'A stablecoin protocol utilizing collateralized debt positions',
		logo: <LogoQiDAO className={'text-900'} />
	}, {
		name: 'Element Finance',
		description: 'An open source protocl for fixed and variable yield markets',
		logo: <LogoElement className={'text-900'} />
	}, {
		name: 'Brave',
		description: 'Fast, private, secure web browser for PC, Mac, and mobile',
		logo: <LogoBrave className={'text-900'} />
	}, {
		name: 'Abracadabra',
		description: 'A decentralized crypto lending platform ',
		logo: <LogoMIM className={'text-900'} />
	}, {
		name: 'Ledger',
		description: 'An application to quickly and securely manage their assets',
		logo: <LogoLedger className={'text-900'} />
	}, {
		name: 'Alchemix',
		description: 'Self-repaying loans without risk of liquidation',
		logo: <LogoAlchemix className={'text-900'} />
	}, {
		name: 'Gearbox',
		description: 'A generalized leverage protocol',
		logo: <LogoGearbox className={'text-900'} />
	}, {
		name: 'Inverse Finance',
		description: 'An open source protocol for borrowing and lending assets',
		logo: <LogoInverse className={'text-900'} />
	}, {
		name: 'ZooDAO',
		description: 'A platform that allows users to earn passive income from NFTs',
		logo: <LogoZooDao className={'text-900'} />
	}

];

const PARTNER_SHORT_NAMES: {[key: string]: string} = {
	'QiDAO': 'qidao',
	'Element Finance': 'element',
	'Brave': 'brave', //*
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
	'Brave': <LogoBrave className={'text-900 h-3/4 w-3/4'} />,
	'Abracadabra': <LogoMIM className={'text-900 h-3/4 w-3/4'} />,
	'Ledger': <LogoLedger className={'text-900 h-3/4 w-3/4'} />,
	'Alchemix': <LogoAlchemix className={'text-900 h-3/4 w-3/4'} />,
	'Gearbox': <LogoGearbox className={'text-900 h-3/4 w-3/4'} />,
	'Inverse Finance': <LogoInverse className={'text-900 h-3/4 w-3/4'} />,
	'ZooDAO': <LogoZooDao className={'text-900 h-3/4 w-3/4'} />
};

export {
	LOGOS, PARTNER_SHORT_NAMES, PARTNERS
};
