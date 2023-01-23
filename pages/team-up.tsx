import React from 'react';
import {Card} from '@yearn-finance/web-lib/components/Card';

import type {ReactElement} from 'react';

function	TeamUpPage(): ReactElement {
	return (
		<div className={'w-full'}>
			<Card>
				<div className={'flex w-full flex-row justify-between pb-6'}>
					<h4>{'Team Up'}</h4>
				</div>
				<div className={'space-y-6'}>
					<p>
						{'Yearn’s partnership program allows developers to easily integrate yield-generation into their own services. '}
					</p>

					<p>
						{'To make yVaults accessible from virtually anywhere, any protocol that integrates yVaults can earn up to a 50% profit share from their contributed TVL. The partnership program launched in early 2021 and has been battle tested by our wide range of partners. '}
					</p>

					<p>
						{'If you are interested in partnering with us, we’d love to hear from you! Please reach out to us through this Yearn Partners form. '}
					</p>

					<p>
						<a
							href={'https://yearnfinance.typeform.com/to/uP7xOJUN'}
							target={'_blank'}
							rel={'noreferrer'}
							className={'link'}>{'Partner Form'}
						</a>
					</p>
				</div>
			</Card>
		</div>
	);
}

export default TeamUpPage;
