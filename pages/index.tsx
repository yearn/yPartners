import Link from 'next/link';
import B2BMeme from 'components/B2BMeme';
import SectionStats from 'components/SectionStats';
import SectionTargets from 'components/SectionTargets';
import {Button} from 'lib/yearn/components/Button';

import type {ReactElement} from 'react';

function	Index(): ReactElement {
	return (
		<main>
			<section aria-label={'hero'} className={'mb-28 mt-[85px] grid grid-cols-12 items-center'}>
				<div className={'col-span-12 md:col-span-8'}>
					<h1 className={'mb-6 text-6xl font-black text-neutral-900 md:text-8xl'}>{'Yearn Partners'}</h1>
					<p className={'text-lg'}>{'Integrate Yearn vaults to earn 50% profit share'}</p>
					<div className={'mt-4 flex flex-col gap-3 sm:flex-row sm:space-x-4 sm:gap-0'}>
						<Link href={'/team-up'}>
							<Button className={'w-full sm:w-[150px] md:w-[200px]'}>
								{'Apply'}
							</Button>
						</Link>
						<Link href={'/faq'}>
							<Button className={'w-full sm:w-[150px] md:w-[200px]'} variant={'outlined'}>
								{'FAQ'}
							</Button>
						</Link>
					</div>
				</div>
				<div className={'col-span-4 hidden md:block'}>
					<B2BMeme />
				</div>
			</section>

			<SectionStats />

			<section aria-label={'partner-steps'} className={'mb-28'}>
				<div className={'rounded-2xl border-2 border-neutral-300 bg-white p-6 md:p-8'}>
					<h2 className={'mb-4 text-3xl font-bold text-neutral-900'}>
						{'Become a partner in 3 easy steps:'}
					</h2>
					<ol className={'list-decimal space-y-3 pl-6 text-lg text-neutral-900'}>
						<li>
							{'Fill out the '}
							<Link href={'/team-up'} className={'underline'}>
								{'contact form'}
							</Link>
						</li>
						<li>
							{'Configure your frontend to direct deposits through our referral contract at 0x3744Df2673097d738aCaa3E463E6D638867757f2 with the chosen referral code (more info in '}
							<Link href={'/faq'} className={'underline'}>{'FAQ'}</Link>
							{')'}
						</li>
						<li>
							{'Notify us that you\'re ready to begin, and we start sharing profits!'}
						</li>
					</ol>
				</div>
			</section>

			<SectionTargets />

		</main>
	);
}

export default Index;
