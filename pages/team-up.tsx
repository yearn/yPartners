import React from 'react';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';

import type {ReactElement} from 'react';


function	TeamUpPage(): ReactElement {
	return (
		<div className={'w-full bg-neutral-200 p-6'}> 	
			<div className={'max-w-screen-md p-2'}>
			
				<h1 className={'pb-6 text-3xl'} >{'Let’s Team Up!'}</h1>
				
				<div className={'space-y-6 text-neutral-600'}>
					<p>
						{'Yearn’s Partnership Program lets developers easily integrate yield-generation into whatever they’re building.'}
					</p>
					<p>
						{'yVaults are designed to be integrated into virtually any service, making them accessible from anywhere. Plus, any protocol that integrates yVaults can earn up to 50% profit share from their contributed TVL. Nice!'}
					</p>
					<p>
						{'Our partnership program has been battle tested by a wide range of partners since it launched in early 2021.'}
					</p>
					<p>
						{'If you’d like to team up, we’d love to hear from you! Simply reach out using the Yearn Partners form below.'}
					</p>

					<a
						href={'https://yearnfinance.typeform.com/to/uP7xOJUN'}
						target={'_blank'}
						rel={'noreferrer'}
						className={'flex max-w-[13rem] items-center justify-center bg-neutral-900 p-2 text-base font-medium text-white'}>
						{'Fill the form'}
						<IconLinkOut className={'ml-3 h-4 w-4 text-white transition-colors md:h-4 md:w-4'} />
					</a>
					
				</div>
			</div>
		</div>
	);
}

export default TeamUpPage;
