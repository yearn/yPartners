import React from 'react';
import {Card} from '@yearn-finance/web-lib/components/Card';

import type {ReactElement} from 'react';

function	TeamUpPage(): ReactElement {
	return (
		<div className={'w-full'}>
			<Card>
				<div className={'flex w-full flex-row justify-between pb-6'}>
					<h4>{'Learn More'}</h4>
				</div>
				<div className={'space-y-6'}>
					<p>
						{'Yearn’s Partnership Program is aimed at protocols that want to build on top of Yearn’s products. We firmly believe that the value a protocol brings to the community, and the ecosystem, is more than just funds parked in a vault.'}
					</p>

					<p>
						{'To this end, we work closely with our partners to integrate and form a mutually beneficial relationship to add value to both protocols.'}
					</p>

					<p>
						{'There are multiple methods to integrate with yearn finance vaults, including deploying a wrapper contract or deploying a routing contract for each vault utilized.'}
					</p>

					<p>
						{'To learn more about profit sharing, integration methods, and yearn products check out our docs!'}
					</p>

					<p>
						<a
							href={'https://docs.yearn.finance/partners/introduction'}
							target={'_blank'}
							rel={'noreferrer'}
							className={'link'}>{'Yearn Partner Docs'}
						</a>
					</p>
				</div>
			</Card>
		</div>
	);
}

export default TeamUpPage;
