import IconCoin from 'components/icons/IconCoin';
import IconEarnYield from 'components/icons/IconEarnYield';
import IconFundCause from 'components/icons/IconFundCause';
import IconManagedVaults from 'components/icons/IconManagedVaults';
import IconMarketplace from 'components/icons/IconMarketplace';

import type {ReactElement} from 'react';

type	TTarget = {
	name: string;
	description: string;
	proof: {
		name: string;
		partner: string;
		detail: string;
	};
	logo: ReactElement;
};

type	TTargetsProps = {
	onSelectPartner: (name: string) => void;
};

const	targets: TTarget[] = [
	{
		name: 'Launch a yield-bearing token',
		description: 'Stand up your stablecoin, LST, or RWA yield product on a battle-tested vault engine — without rebuilding custody, strategy, or fees.',
		proof: {name: 'Katana', partner: 'Katana', detail: '$233.7M TVS'},
		logo: <IconCoin className={'text-neutral-900'} />
	}, {
		name: 'Earn yield on idle funds',
		description: 'Put treasury, collateral, or user deposits to work in actively-managed vaults — nothing of your own to build or maintain.',
		proof: {name: 'Alchemix', partner: 'Alchemix', detail: '$3.5M'},
		logo: <IconEarnYield className={'text-neutral-900'} />
	}, {
		name: 'Embed a yield marketplace',
		description: 'Offer curated Yearn vaults inside your frontend or aggregator, across chains and assets — and earn 50% profit share on the flow-through.',
		proof: {name: 'Superform', partner: 'Superform', detail: '800+ opportunities'},
		logo: <IconMarketplace className={'text-neutral-900'} />
	}, {
		name: 'Fund a cause with perpetual yield',
		description: 'Redirect vault yield to public goods, governance, or a designated recipient — turning deposits into sustainable, recurring funding.',
		proof: {name: 'Curve', partner: 'Curve Finance', detail: '$20M in fee donations'},
		logo: <IconFundCause className={'text-neutral-900'} />
	}, {
		name: 'Get managed vaults, done for you',
		description: 'Have Yearn curate and run vaults on your network or for your asset, so your users get professional yield out of the box.',
		proof: {name: 'Origin', partner: 'Origin Protocol', detail: 'OUSD V1/V2'},
		logo: <IconManagedVaults className={'text-neutral-900'} />
	}
];

function	Targets({onSelectPartner}: TTargetsProps): ReactElement {
	return (
		<section aria-label={'targets'} className={'mb-14 flex flex-col space-y-8 md:mb-[100px] md:flex-row md:items-center md:space-y-0 md:space-x-8'}>
			<div className={'min-w-0'}>
				<div className={'flex flex-col space-y-4'}>
					<h2 className={'text-3xl font-bold'}>{'Permissionless DeFi base layer enabling infinite possibilities'}</h2>
				</div>
				<div className={'mt-8 grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3'}>
					{targets.map((target: TTarget): ReactElement => (
						<div
							key={target.name}
							className={'flex h-66 flex-col justify-between border-2 border-neutral-400 p-6'}>
							<div className={'h-14'}>
								{target.logo}
							</div>
							<div className={'space-y-2'}>
								<b className={'text-xl'}>{target.name}</b>
								<p>{target.description}</p>
								{target.proof ? (
									<p className={'text-sm text-neutral-500'}>
										<button
											type={'button'}
											onClick={(): void => onSelectPartner(target.proof.partner)}
											className={'font-semibold text-neutral-800 underline-offset-2 hover:underline'}>
											{target.proof.name}
										</button>
										{' · '}
										{target.proof.detail}
									</p>
								) : null}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default Targets;
