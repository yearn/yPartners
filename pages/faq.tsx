import type {ReactElement} from 'react';

function	FAQPage(): ReactElement {
	return (
		<div className={'w-full bg-neutral-200 p-6'}>
			<div className={'mx-auto max-w-screen-lg space-y-8 p-2 sm:p-4'}>
			
				<h1 className={'pb-6 text-3xl font-bold'}>{'Frequently Asked Questions'}</h1>
				
				<section className={'mt-12 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm'}>
					<div className={'space-y-6 text-neutral-700 text-base sm:text-lg'}>
						<div>
							<p className={'text-lg font-semibold text-neutral-900 sm:text-xl'}>{'What is this partners program about?'}</p>
							<p>
								{'If you want to enable users to deposit into Yearn vaults from your dApp, you can partner with Yearn and earn half of the fees from your users depositing into Yearn vaults. This applies only to Yearn v3 vaults and active yLockers, as we do not currently wish to incentivize building on older Yearn projects.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-semibold text-neutral-900 sm:text-xl'}>{'What are the benefits for partners?'}</p>
							<p>
								{'Yearn vaults earn fees, and partners get a 50% split of the fees earned by the TVL that they have direct to Yearn vaults.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-semibold text-neutral-900 sm:text-xl'}>{'What is required to onboard a new partner?'}</p>
							<p>
								{'Not much, we just need a way to identify the correct list of user addresses who deposit into Yearn vaults from your frontend. One way to do this is to deploy a '}
								<a
									className={'text-primary-600 underline'}
									href={'https://github.com/yearn/Yearn-ERC4626-Router'}
									rel={'noreferrer'}
									target={'_blank'}>
									{'Yearn 4626 Router contract'}
								</a>
								{' that acts as a passthrough to Yearn vaults, and this Router contract will be specific to your partnership. Currently, partnering with Yearn is not permissionless as there is no way to automatically claim fees without manual effort.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-semibold text-neutral-900 sm:text-xl'}>{'If my protocol becomes a partner, how do I know the amount of fees accrued to my protocol? When do I get my payout?'}</p>
							<p>
								{'Easy, Yearn will provide a login for you to view a dashboard showing the fees accumulated to your protocol. You receive a payout each month to your protocol address.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-semibold text-neutral-900 sm:text-xl'}>{'How does Yearn sum all the fees owed to a partner?'}</p>
							<p>
								{'In the background, envio is used to track all deposit, withdraw, and transfer events for relevant Yearn vaults. The list of addresses who deposited into Yearn from your frontend serves as a whitelist to focus only on the events related to the movement of Yearn vault tokens for those users. By calculating the vault PPS (price per share) at every deposit, withdraw, or transfer, it is possible to sum the total fees accrued by a user piece-by-piece over time.'}
							</p>
						</div>
						<div>
							<p className={'text-lg font-semibold text-neutral-900 sm:text-xl'}>{'What if a single user deposits into Yearn from two different partner websites?'}</p>
							<p>
								{'Yes, that is a tricky situation for sure. Yearn does its best to calculate the fees owned to each party, our backend algo for this is improving every week. The goal is to keep the fee ratio split evenly between N partners, where deposits are attributed to a single partner but withdrawals withdraw from all partners (maintaining the same fee split ratio determined by deposits). If your calculations differ, we are happy to discuss!'}
							</p>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default FAQPage;
