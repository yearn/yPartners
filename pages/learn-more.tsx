import type {ReactElement} from 'react';

function	LearnMorePage(): ReactElement {
	return (
		<div className={'mb-40 w-full bg-neutral-200 p-6'}>
			<div className={'mx-auto max-w-screen-md p-2 sm:p-4'}>
			
				<h1 className={'pb-6 text-3xl font-bold'}>{'Learn More'}</h1>
				
				<div className={'space-y-6 text-neutral-600'}>
					<p>
						{'Imagine it anon. An open, permissionless and interoperable financial layer for the world… wistful sigh. Yearn’s Partnership Program is designed for protocols that want to build on top of Yearn’s DeFi leading yield products. Or, if you prefer VC speak, Yield As A Service (YAAS).'}
					</p>
					<p>
						{'We firmly believe that the value a protocol brings to the community and ecosystem is far more than just funds parked in a vault. So we work closely with our partners to integrate and form a mutually beneficial relationship, adding value to both protocols.'}
					</p>
				</div>

				<section className={'mt-12 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm'}>
					<h2 className={'pb-4 text-2xl font-semibold text-neutral-900'}>{'FAQ'}</h2>
					<div className={'space-y-4 text-neutral-700'}>
						<div>
							<p className={'text-lg font-medium'}>{'How long does it take to onboard a new partner?'}</p>
							<p>
								{'Timelines vary with integration depth, but our team typically gets a partner to production in a few weeks once the scope is aligned and smart contract reviews are complete.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-medium'}>{'Do we need a minimum TVL or user base to apply?'}</p>
							<p>
								{'No fixed minimums. We prioritize protocols that bring unique value to the ecosystem, so tell us about your vision, users, and what you want to build with Yearn.'}
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default LearnMorePage;
