import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import B2BMeme from 'components/B2BMeme';
import HeroStats from 'components/HeroStats';
import SectionPartnerLogos from 'components/SectionPartnerLogos';
import SectionTargets from 'components/SectionTargets';
import {Button} from 'lib/yearn/components/Button';

import type {ReactElement} from 'react';

function	Index(): ReactElement {
	const	[activePartner, setActivePartner] = useState<string | null>(null);
	const	shouldScrollToDetail = useRef(false);

	const	togglePartner = (name: string): void => {
		setActivePartner((prev): string | null => prev === name ? null : name);
	};

	const	selectPartnerFromTargets = (name: string): void => {
		setActivePartner(name);
		shouldScrollToDetail.current = true;
	};

	// After selecting a partner from the Targets cards, scroll the expanded
	// detail panel into view (it renders below the logo grid).
	useEffect((): void => {
		if (shouldScrollToDetail.current && activePartner) {
			document.getElementById('partner-logos-detail')?.scrollIntoView({behavior: 'smooth', block: 'start'});
			shouldScrollToDetail.current = false;
		}
	}, [activePartner]);

	return (
		<main>
			<section aria-label={'hero'} className={'mb-[2.8rem] mt-[42.5px] grid grid-cols-12 items-start'}>
				<div className={'col-span-12 md:col-span-8'}>
					<h1 className={'mb-6 text-6xl font-black text-neutral-900 md:text-8xl'}>{'Yearn Partners'}</h1>
					<HeroStats />
					<div className={'mt-4 flex flex-col gap-3 sm:flex-row sm:space-x-4 sm:gap-0'}>
						<Link href={'/team-up'}>
							<Button className={'w-full text-xl sm:w-[150px] md:w-[200px]'}>
								{'Apply'}
							</Button>
						</Link>
						<Link href={'/faq'}>
							<Button className={'w-full text-xl sm:w-[150px] md:w-[200px]'} variant={'outlined'}>
								{'FAQ'}
							</Button>
						</Link>
					</div>
				</div>
				<div className={'col-span-4 hidden md:block'}>
					<B2BMeme />
				</div>
			</section>

			<SectionPartnerLogos activeName={activePartner} onToggle={togglePartner} />

			<SectionTargets onSelectPartner={selectPartnerFromTargets} />

			<section aria-label={'partner-steps'} className={'mb-20'}>
				<div className={'rounded-2xl border-2 border-neutral-300 bg-white p-6 md:p-8'}>
					<h2 className={'mb-4 text-3xl font-bold text-neutral-900'}>
						{'Become a partner in 5 minutes'}
					</h2>
					<p className={'text-lg text-neutral-900'}>
						{'Fill out the '}
						<Link href={'/team-up'} className={'underline'}>
							{'contact form'}
						</Link>
						{' and we will soon be in touch'}
					</p>
				</div>
			</section>

		</main>
	);
}

export default Index;
