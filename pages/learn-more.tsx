import React from 'react';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';

import type {ReactElement} from 'react';


function	LearnMorePage(): ReactElement {
	return (
		<div className={'mb-40 w-full bg-neutral-200 p-6'}>
			<div className={'max-w-screen-md p-2'}>
			
				<h1 className={'pb-6 text-3xl'}>{'Learn more'}</h1>
				
				<div className={'space-y-6 text-neutral-600'}>
					<p>
						{'Yearn’s Partnership Program is aimed at protocols that want to build on top of Yearn’s DeFi leading yield products.'}
					</p>
					<p>
						{'We firmly believe that the value a protocol brings to the community and ecosystem is far more than just funds parked in a vault. To this end, we work closely with our partners to integrate and form a mutually beneficial relationship to add value to both protocols.'}
					</p>
					<p>
						{'There are multiple methods to integrate with Yearn Vaults, including deploying a wrapper or routing contract for each vault utilized.'}
					</p>
					<p>
						{'Learn more about profit sharing, integration methods, and Yearn products with our docs!'}
					</p>

					<a
						href={'https://docs.yearn.finance/partners/introduction'}
						target={'_blank'}
						rel={'noreferrer'}
						className={'flex max-w-[13rem] items-center justify-center bg-neutral-900 p-2 text-base font-medium text-white '}>
						{'Explore Docs'}
						<IconLinkOut className={'ml-3 h-4 w-4 text-white transition-colors md:h-4 md:w-4'} />
					</a>
					
				</div>
			</div>
		</div>
	);
}

export default LearnMorePage;
