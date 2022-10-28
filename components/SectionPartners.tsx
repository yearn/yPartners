import	React, {ReactElement, useEffect, useState}	from	'react';
import router from 'next/router';
import	{motion}				from	'framer-motion';
import {usePartner} from 'contexts/usePartner';
import {PARTNERS} from 'utils/b2b/Partners';

import	type {TFramerTransition, TPartnerList}		from	'types/types';

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

function	Partners(): ReactElement {
	const	{set_partner} = usePartner();
	const	[partnerList, set_partnerList] = useState<TPartnerList[]>([]);

	useEffect((): void => {
		const	_partnerList: TPartnerList[] = [...PARTNERS];
		_partnerList.sort((): number => Math.random() - 0.5);
		set_partnerList(_partnerList);
	}, []);

	async function navToDashboard(partner: string): Promise<void> {
		if(set_partner){
			set_partner(partner);
			router.push('/dashboard');
		}
	}


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
							className={'flex flex-col justify-between p-6 h-66 bg-neutral-200 border-2 border-neutral-200 cursor-pointer'}
							variants={variants}
							onClick={async (): Promise<void> => navToDashboard(partner.name)}	
						>
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
