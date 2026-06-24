import IconForDevelopers from 'components/icons/IconForDevelopers';
import IconForInstitutions from 'components/icons/IconForInstitutions';
import IconForProtocols from 'components/icons/IconForProtocols';

import type {ReactElement} from 'react';
import type {TPartner} from 'types/types';

const	targets: TPartner[] = [
	{
		name: 'For Protocols',
		shortName: 'protocols',
		description: 'Integration platform for  effortless yield optimization',
		logo: <IconForProtocols className={'text-900'} />
	}, {
		name: 'For Organizations & Institutions',
		shortName: 'institutions',
		description: 'Infrastructure for accessing fixed yield in a compliant manner',
		logo: <IconForInstitutions className={'text-900'} />
	}, {
		name: 'For Developers',
		shortName: 'developers',
		description: 'Sandbox for novel and innovative DeFi applications',
		logo: <IconForDevelopers className={'text-900'} />
	}
];

function	Targets(): ReactElement {
	return (
		<section aria-label={'targets'} className={'mb-28 flex flex-col space-y-8 md:mb-50 md:flex-row md:items-center md:space-y-0 md:space-x-8'}>
			<div className={'min-w-0'}>
				<div className={'flex flex-col space-y-4'}>
					<h2 className={'text-3xl font-bold'}>{'Yearn Finance - Powerful & Secure Yield Optimizer'}</h2>
					<p className={'text-2xl'}>{'Permissionless DeFi base layer enabling infinite possibilities for buildooors.'}</p>
				</div>
				<div className={'mt-8 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3'}>
					{targets.map((target: TPartner): ReactElement => (
						<div
							key={target.name}
							className={'flex h-66 flex-col justify-between border-2 border-neutral-400 p-6'}>
							<div className={'h-14'}>
								{target.logo}
							</div>
							<div className={'space-y-2'}>
								<b className={'text-xl'}>{target.name}</b>
								<p>{target.description}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default Targets;
