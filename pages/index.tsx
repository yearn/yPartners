import Link from 'next/link';
import B2BMeme from 'components/B2BMeme';
import SectionPartner from 'components/SectionPartners';
import SectionStats from 'components/SectionStats';
import SectionTargets from 'components/SectionTargets';
import {Button} from '@yearn-finance/web-lib/components/Button';

import type {ReactElement} from 'react';

function	Index(): ReactElement {
	return (
		<main>
			<section aria-label={'hero'} className={'mt-[85px] mb-28 grid grid-cols-12 items-center'}>
				<div className={'col-span-12 md:col-span-8'}>
					<h1 className={'mb-6 text-6xl text-neutral-900 md:text-8xl'}>{'Yearn Partners'}</h1>
					<p className={'text-lg'}>{'Integrate Yearn vaults to earn up to 50% profit share'}</p>
					<div className={'mt-4 flex flex-row space-x-4'}>
						<Link href={'/team-up'}>
							<Button className={'w-[150px] md:w-[200px]'}>
								{'Apply'}
							</Button>
						</Link>
						<Link href={'/learn-more'}>
							<Button className={'w-[150px] md:w-[200px]'} variant={'outlined'}>
								{'Learn More'}
							</Button>
						</Link>
					</div>
				</div>
				<div className={'col-span-4 hidden md:block'}>
					<B2BMeme />
				</div>
			</section>

			<SectionStats />

			<SectionTargets />

			<SectionPartner />
		</main>
	);
}

export default Index;
