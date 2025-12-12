import {useMemo} from 'react';
import {PARTNERS} from 'utils/Partners';
import {motion} from 'framer-motion';
import type {Variants} from 'framer-motion';

import DefaultLogo from './icons/partners/DefaultLogo';

import type {ReactElement} from 'react';
import type {TPartner} from 'types/types';
import type {TDict} from 'lib/yearn/utils/types';

const variants: Variants = {
	enter: (i: number) => ({
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

function	Partners(): ReactElement {
	const partnerList = useMemo((): TPartner[] => {
		const entries: TDict<TPartner> = {};

		for (const [shortName, partner] of Object.entries(PARTNERS)) {
			const logo = partner.logo || <DefaultLogo className={'text-900'} />;
			entries[shortName] = {...partner, logo};
		}

		return Object.values(entries);
	}, []);


	return (
		<section aria-label={'partners'} className={'mb-28 flex flex-col space-y-8 md:mb-50 md:flex-row md:items-center md:space-y-0 md:space-x-8'}>
			<div>
				<div>
					<h2 className={'text-3xl font-bold'}>{'Built on Yearn'}</h2>
				</div>
				<div className={'mt-8 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3'}>
					{partnerList?.map((partner: TPartner, i: number): ReactElement => (
						<motion.div
							key={partner.name}
							custom={i % 3}
							initial={'initial'}
							whileInView={'enter'}
							className={'flex flex-col justify-between border-2 border-neutral-200 bg-neutral-200 p-6 sm:h-[16.5rem] md:h-[21.5rem] lg:h-[18.5rem]'}
							variants={variants}>
							<div className={'min-h-10 max-height-10 mb-5'}>
								{partner.logo}
							</div>
							<div className={'h-full space-y-2'}>
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
