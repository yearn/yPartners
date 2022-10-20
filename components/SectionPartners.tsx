import	React, {ReactElement}	from	'react';
import	{motion}				from	'framer-motion';
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

const variants = {
	enter: (i: number): any => ({
		y: 0,
		opacity: 1,
		transition: {
			delay: i * 0.1,
			duration: 0.5,
			ease: 'linear'
		}
	}),
	initial: {y: 60, opacity: 0}
};

const	partners: TPartnerList[] = [
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

function	Partners(): ReactElement {
	const	[partnerList, set_partnerList] = React.useState<TPartnerList[]>([]);

	React.useEffect((): void => {
		const	_partnerList: TPartnerList[] = [...partners];
		_partnerList.sort((): number => Math.random() - 0.5);
		set_partnerList(_partnerList);
	}, []);

	return (
		<section aria-label={'partners'} className={'flex flex-row items-center mb-28 space-x-8 md:mb-50'}>
			<div>
				<div>
					<h2 className={'text-3xl font-bold'}>{'Built on Yearn'}</h2>
				</div>
				<div className={'grid grid-cols-1 gap-8 mt-8 w-full max-w-5xl md:grid-cols-3'}>
					{partnerList?.map((partner: TPartnerList, i: number): ReactElement => (
						<motion.div
							key={partner.name}
							custom={i % 3}
							initial={'initial'}
							whileInView={'enter'}
							className={'flex flex-col justify-between p-6 bg-neutral-200 border-2 border-neutral-200 h-66'}
							variants={variants}>
							<div className={'h-14'}>
								{partner.logo}
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{partner.name}</b>
								<p>{partner.description}</p>
							</div>
						</motion.div>	
					))}
				</div>
			</div>
		</section>
	);
}

export default Partners;
