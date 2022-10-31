import {ReactElement} from 'react';
import	LogoAlchemix			from	'components/icons/partners/LogoAlchemix';
import	LogoBrave				from	'components/icons/partners/LogoBrave';
import	LogoElement				from	'components/icons/partners/LogoElement';
import	LogoGearbox				from	'components/icons/partners/LogoGearbox';
import	LogoInverse				from	'components/icons/partners/LogoInverse';
import	LogoLedger				from	'components/icons/partners/LogoLedger';
import	LogoMIM					from	'components/icons/partners/LogoMIM';
import	LogoQiDAO				from	'components/icons/partners/LogoQiDAO';
import	LogoZooDao				from	'components/icons/partners/LogoZooDAO';

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

type TPartnerLogo = {
	[key: string]: ReactElement
}

const LOGOS: TPartnerLogo = {
	'QiDAO': <LogoQiDAO className={'w-3/4 h-3/4 text-900'} />,
	'Element Finance': <LogoElement className={'w-3/4 h-3/4 text-900'} />,
	'Brave': <LogoBrave className={'w-3/4 h-3/4 text-900'} />,
	'Abracadabra': <LogoMIM className={'w-3/4 h-3/4 text-900'} />,
	'Ledger': <LogoLedger className={'w-3/4 h-3/4 text-900'} />,
	'Alchemix': <LogoAlchemix className={'w-3/4 h-3/4 text-900'} />,
	'Gearbox': <LogoGearbox className={'w-3/4 h-3/4 text-900'} />,
	'Inverse Finance': <LogoInverse className={'w-3/4 h-3/4 text-900'} />,
	'ZooDAO': <LogoZooDao className={'w-3/4 h-3/4 text-900'} />
};

export {LOGOS, PARTNERS};