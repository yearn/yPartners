import type {ReactElement} from 'react';

function	FAQPage(): ReactElement {
	return (
		<div className={'mb-40 w-full bg-neutral-200 p-6'}>
			<div className={'mx-auto max-w-screen-md p-2 sm:p-4'}>
			
				<h1 className={'pb-6 text-3xl font-bold'}>{'Frequently Asked Questions'}</h1>
				
				<div className={'space-y-6 text-neutral-600'}>
				</div>

				<section className={'mt-12 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm'}>
					<div className={'space-y-4 text-neutral-700'}>
						<div>
							<p className={'text-lg font-semibold text-neutral-900'}>{'What is required to onboard a new partner?'}</p>
							<p>
								{'Not much, we just need a way to identify the correct list of user addresses who deposit into Yearn vaults from your frontend. One way to do this is to deploy a Yearn 4626 Router contract that acts as a passthrough to Yearn vaults, and this Router contract will be specific to your partnership.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-semibold text-neutral-900'}>{'What if a single user deposits into Yearn from two different partner websites?'}</p>
							<p>
								{'Yes, this is a complicated situation for sure. Yearn will do its best to calculate the fees owned to each party, our backend algo for this is improving every week.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-semibold text-neutral-900'}>{'How does Yearn sum all the fees owed to a partner?'}</p>
							<p>
								{'In the background, envio is used to track all deposit, withdraw, and transfer events for relevant Yearn vaults. The list of addresses who deposited into Yearn from your frontend serves as a whitelist to focus only on the events related to the movement of Yearn vault tokens for those users. By calculating the vault PPS (price per share) at every deposit, withdraw, or transfer, it is possible to sum the total fees accrued by a user piece-by-piece over time.'}
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default FAQPage;
