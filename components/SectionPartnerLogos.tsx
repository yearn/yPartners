import {AnimatePresence, motion} from 'framer-motion';
import Image from 'next/image';

import type {ReactElement} from 'react';

type TPartnerLogosProps = {
	activeName: string | null;
	onToggle: (name: string) => void;
};

const	partnerLogos = [
	{
		name: 'Asymmetry',
		src: '/partner-logos-dark/Asymmetry_Finance_Logo_Light.svg',
		description: 'sUSDaf is a Yearn V3 vault that auto-rebalances USDaf across Stability Pools, offering one-click access to optimized USDaf yields using Yearn’s oracle-free, battle-tested patterns.'
	},
	{
		name: 'Cap',
		src: '/partner-logos-dark/cap.svg',
		description: 'Cap’s capUSDC is a Yearn V3 vault — its "USDC Fractional Reserve Vault" — backing the cUSD stablecoin and the stcUSD yield-bearing savings token with battle-tested Yearn infrastructure.'
	},
	{
		name: 'Curve Finance',
		src: '/partner-logos-dark/Curve.svg',
		description: 'Curve’s scrvUSD is a Yearn V3 vault that turns crvUSD into a savings token, routing crvUSD fee donations to depositors through a custom Yearn "report on self" mechanism.'
	},
	{
		name: 'Katana',
		src: '/partner-logos-dark/katana_logo_primary_lockup_spark.svg',
		description: 'Katana is a DeFi-focused L2 underpinned by Yearn, using Yearn V3 vaults and a VaultBridge that routes bridged assets into Yearn and Morpho vaults to earn yield from day one ($233M+ TVS).'
	},
	{
		name: 'Origin Protocol',
		src: '/partner-logos-dark/Origin.svg',
		description: 'Origin routes OUSD collateral to a Morpho vault curated jointly with Yearn, and uses Yearn vaults as yield boosters that compound rewards for passive OETH holders.'
	},
	{
		name: 'Superform',
		src: '/partner-logos-dark/Superform.svg',
		description: 'Superform is a universal yield marketplace that lists Yearn V3 vaults among 800+ earning opportunities across 50+ protocols, enabling cross-chain deposits into Yearn from any chain using any asset.'
	},
	{
		name: 'Teller',
		src: '/partner-logos-dark/teller-logo.svg',
		description: 'Teller uses Yearn vaults as built-in strategies across its lending pools, with Yearn-powered vaults for USDS, USDC, and more live on Ethereum, Arbitrum, and Base.'
	},
	{
		name: 'Alchemix',
		src: '/partner-logos-dark/Alchemix_Black.svg',
		description: 'Alchemix V3’s "Risk Adjusted Mix USDC" vault integrates a yvUSD strategy that deposits into Yearn, extending a long-running relationship that previously ran Yearn vaults on Optimism.'
	},
	{
		name: 'Inverse',
		src: '/partner-logos-dark/Inverse_Finance_Logo_05.svg',
		description: 'Inverse integrates Yearn-curated vaults and uses yCRV as collateral within Firm, its lending product.'
	},
	{
		name: 'Robin',
		src: '/partner-logos-dark/robin.svg',
		description: 'Robin embeds Yearn-curated vaults as part of its offering at robin.markets.'
	},
	{
		name: 'Octant',
		src: '/partner-logos-dark/Octant-logo.svg',
		description: 'Octant builds yield-donating vaults on Yearn V3 patterns, forking the TokenizedStrategy to redirect profits to public goods — including wrapper strategies that wrap existing Yearn vaults.'
	},
	{
		name: 'Term',
		src: '/partner-logos-dark/Term.svg',
		description: 'Term Finance builds its fixed-rate lending vaults on Yearn’s V3 TokenizedStrategy framework, blending fixed-rate lending (~7.5% APY) with Yearn baseline yields (~$21M TVL).'
	},
	{
		name: 'Sturdy',
		src: '/partner-logos-dark/sturdy.svg',
		description: 'Sturdy’s aggregator layer is built on the Yearn V3 framework — its yield optimizers distribute lender deposits across whitelisted isolated silos, with allocations fed by a Bittensor AI subnet.'
	},
	{
		name: 'Swell',
		src: '/partner-logos-dark/swell-light.svg',
		description: 'Swell’s swBTC is a Yearn V3 vault integrating with Aera, bringing battle-tested Yearn infrastructure to its Bitcoin liquid restaking token.'
	},
	{
		name: 'Birch Hill',
		src: '/partner-logos-dark/birch-hill-logo.svg',
		description: 'Birch Hill’s RWA USDC Vault is built on the Yearn v3 framework, supplying USDC into curated, permissioned Morpho lending markets on Base — starting with lending against Groma’s tokenized real-estate collateral.'
	}
];

function	PartnerLogos({activeName, onToggle}: TPartnerLogosProps): ReactElement {
	const	activeLogo = partnerLogos.find((logo): boolean => logo.name === activeName) ?? null;

	return (
		<section id={'partner-logos'} aria-label={'partner-logos'} className={'mb-14 md:mb-[100px]'}>
			<h3 className={'mb-3 text-xl font-semibold text-neutral-800'}>{'Teams building on Yearn'}</h3>
			<div className={'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}>
				{partnerLogos.map((logo): ReactElement => {
					const	isActive = logo.name === activeName;
					return (
						<button
							key={logo.name}
							type={'button'}
							aria-expanded={isActive}
							aria-controls={'partner-logos-detail'}
							onClick={(): void => onToggle(logo.name)}
							className={`flex cursor-pointer items-center justify-center rounded-xl p-2 transition-all duration-300 ${isActive ? 'opacity-100 ring-2 ring-neutral-400' : 'opacity-70 hover:opacity-100'}`}>
							<div className={'relative h-10 w-32 md:h-12 md:w-48'}>
								<Image
									alt={`${logo.name} logo`}
									src={logo.src}
									fill
									className={'object-contain'}
								/>
							</div>
						</button>
					);
				})}
			</div>

			<AnimatePresence initial={false}>
				{activeLogo ? (
					<motion.div
						key={'partner-logos-detail'}
						id={'partner-logos-detail'}
						initial={{opacity: 0, height: 0}}
						animate={{opacity: 1, height: 'auto'}}
						exit={{opacity: 0, height: 0}}
						transition={{duration: 0.3, ease: [0.4, 0, 0.2, 1]}}
						className={'overflow-hidden'}>
						<div className={'pt-6'}>
							<div className={'rounded-2xl border-2 border-neutral-300 bg-white p-6 md:p-8'}>
								<AnimatePresence initial={false} mode={'wait'}>
									<motion.div
										key={activeLogo.name}
										initial={{opacity: 0, y: 6}}
										animate={{opacity: 1, y: 0}}
										exit={{opacity: 0, y: -6}}
										transition={{duration: 0.18}}>
										<b className={'text-xl font-semibold text-neutral-900'}>{activeLogo.name}</b>
										<p className={'mt-2 text-neutral-700'}>{activeLogo.description}</p>
									</motion.div>
								</AnimatePresence>
							</div>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

export default PartnerLogos;
