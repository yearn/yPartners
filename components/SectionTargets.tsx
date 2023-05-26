import {useEffect, useState} from 'react';
import IconForDevelopers from 'components/icons/IconForDevelopers';
import IconForInstitutions from 'components/icons/IconForInstitutions';
import IconForProtocols from 'components/icons/IconForProtocols';
import {motion} from 'framer-motion';

import type {ReactElement} from 'react';
import type {TFramerTransition, TPartner} from 'types/types';

const variants = {
	enter: (i: number): TFramerTransition => ({
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

const	targets: TPartner[] = [
	{
		name: 'For Protocols',
		shortName: 'protocols',
		description: 'Integration platform for  effortless yield optimization',
		logo: <IconForProtocols className={'text-900'} />
	}, {
		name: 'For Developers',
		shortName: 'developers',
		description: 'Sandbox for novel and innovative DeFi applications',
		logo: <IconForDevelopers className={'text-900'} />
	}, {
		name: 'For Organizations & Institutions',
		shortName: 'institutions',
		description: 'Infrastructure for accessing fixed yield in a compliant manner',
		logo: <IconForInstitutions className={'text-900'} />
	}
];

function	Targets(): ReactElement {
	const	[targetList, set_targetList] = useState<TPartner[]>([]);

	useEffect((): void => {
		const	_targetList: TPartner[] = [...targets];
		_targetList.sort((): number => Math.random() - 0.5);
		set_targetList(_targetList);
	}, []);

	return (
		<section aria-label={'targets'} className={'mb-28 flex flex-row items-center space-x-8 md:mb-50'}>
			<div>
				<div className={'flex flex-col space-y-4'}>
					<h2 className={'text-3xl font-bold'}>{'Yearn Finance - Powerful & Secure Yield Optimizer'}</h2>
					<p className={'text-xl'}>{'Permissionless DeFi base layer enabling infinite possibilities for buildooors.'}</p>
				</div>
				<div className={'mt-8 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3'}>
					{targetList?.map((target: TPartner, i: number): ReactElement => (
						<motion.div
							key={target.name}
							custom={i % 3}
							initial={'initial'}
							whileInView={'enter'}
							className={'flex h-66 flex-col justify-between border-2 border-neutral-400 p-6'}
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
