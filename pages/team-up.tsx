import IconLinkOut from 'lib/yearn/icons/IconLinkOut';

import type {ReactElement} from 'react';


function	TeamUpPage(): ReactElement {
	return (
		<div className={'w-full bg-neutral-200 p-6'}> 	
			<div className={'mx-auto max-w-screen-md p-2 sm:p-4'}>
			
				<h1 className={'pb-6 text-3xl font-bold'} >{'Let’s Team Up!'}</h1>
				
				<div className={'space-y-6 text-neutral-600'}>
					<p>
						{'Have you ever found yourself thinking “Wow! Yearn’s yield generating vaults are a work of DeFi art. I WISH I could integrate them into what we’re building.” Well friend, you’ve come to the right place.'}
					</p>
					<p>
						{'Yearn’s Partnership Program lets developers easily integrate yield-generation into their products and earn 50% profit share from their contributed TVL. As the kids say… “LFG!”.'}
					</p>
					<p>
						{'We firmly believe that the value a protocol brings to the community and ecosystem is far more than just funds parked in a vault. So we work closely with our partners to integrate and form a mutually beneficial relationship, adding value to both protocols. If you’d like to team up, we’d love to hear from you! Simply reach out using the Yearn Partners form below.'}
					</p>

					<a
						href={'https://yearnfinance.typeform.com/to/uP7xOJUN'}
						target={'_blank'}
						rel={'noreferrer'}
						className={'flex w-full items-center justify-center bg-neutral-900 p-2 text-base font-medium text-white sm:max-w-[13rem]'}>
						{'Fill the form'}
						<IconLinkOut className={'ml-3 h-4 w-4 text-white transition-colors md:h-4 md:w-4'} />
					</a>
					
				</div>
			</div>
		</div>
	);
}

export default TeamUpPage;
