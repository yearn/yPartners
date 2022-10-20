import	React, {ReactElement}	from	'react';
import	{motion}				from	'framer-motion';
import	IconForDevelopers		from	'components/icons/IconForDevelopers';
import	IconForInstitutions		from	'components/icons/IconForInstitutions';
import	IconForProtocols		from	'components/icons/IconForProtocols';

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

const	targets: TPartnerList[] = [
	{
		name: 'For Protocols',
		description: 'Integration platform for  effortless yield optimization',
		logo: <IconForProtocols className={'text-900'} />
	}, {
		name: 'For Developers',
		description: 'Sandbox for novel and innovative DeFi applications',
		logo: <IconForDevelopers className={'text-900'} />
	}, {
		name: 'For Organizations & Institutions',
		description: 'Infrastructure for accessing fixed yield in a compliant manner',
		logo: <IconForInstitutions className={'text-900'} />
	}
];

function	Targets(): ReactElement {
	const	[targetList, set_targetList] = React.useState<TPartnerList[]>([]);

	React.useEffect((): void => {
		const	_targetList: TPartnerList[] = [...targets];
		_targetList.sort((): number => Math.random() - 0.5);
		set_targetList(_targetList);
	}, []);

	return (
		<section aria-label={'targets'} className={'flex flex-row items-center mb-28 space-x-8 md:mb-50'}>
			<div>
				<div className={'flex flex-col space-y-4'}>
					<h2 className={'text-3xl font-bold'}>{'Yearn Finance - Powerful & Secure Yield Optimizer'}</h2>
					<p className={'text-xl'}>{'Permissionless DeFi base layer enabling infinite possibilities for buildooors.'}</p>
				</div>
				<div className={'grid grid-cols-1 gap-8 mt-8 w-full max-w-5xl md:grid-cols-3'}>
					{targetList?.map((target: TPartnerList, i: number): ReactElement => (
						<motion.div
							key={target.name}
							custom={i % 3}
							initial={'initial'}
							whileInView={'enter'}
							className={'flex flex-col justify-between p-6 border-2 border-neutral-400 h-66'}
							variants={variants}>
							<div className={'h-14'}>
								{target.logo}
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{target.name}</b>
								<p>{target.description}</p>
							</div>
						</motion.div>	
					))}
				</div>
			</div>
		</section>
	);
}

export default Targets;
