import React from 'react';
import IconLinkOut from '@yearn-finance/web-lib/icons/IconLinkOut';

import type {ReactElement} from 'react';


function	TeamUpPage(): ReactElement {
	return (
		<div className={'w-full bg-neutral-200 p-6'}> 	
			<div className={'max-w-screen-md p-2'}>
			
				<h1 className={'pb-6 text-3xl'} >{'Team Up!'}</h1>
				
				<div className={'space-y-6 text-neutral-600'}>
					<p>
						{'Yearn’s Partnership Program allows developers to easily integrate yield-generation into their own services. '}
						{'To make yVaults accessible from virtually anywhere, any protocol that integrates yVaults can earn up to a 50% profit share from their contributed TVL. The partnership program launched in early 2021 and has been battle tested by our wide range of partners. '}

					</p>

					<p>
						{'If you are interested in partnering with us, we’d love to hear from you! Please reach out to us through this Yearn Partners form. '}
					</p>

					<a
						href={'https://yearnfinance.typeform.com/to/uP7xOJUN'}
						target={'_blank'}
						rel={'noreferrer'}
						className={'flex max-w-[13rem] items-center justify-center bg-black p-2 text-base font-medium text-white '}>
						{'Fill the form'}
						<IconLinkOut className={'ml-3 h-4 w-4 text-white transition-colors md:h-4 md:w-4'} />
					</a>
					
				</div>
			</div>
		</div>
	);
}

export default TeamUpPage;
