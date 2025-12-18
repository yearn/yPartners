import IconForDevelopers from 'components/icons/IconForDevelopers';
import IconForInstitutions from 'components/icons/IconForInstitutions';
import IconForProtocols from 'components/icons/IconForProtocols';
import Image from 'next/image';
import {useEffect, useMemo, useState} from 'react';

import type {ReactElement} from 'react';
import type {TPartner} from 'types/types';

const productLogos = [
	{
		name: 'Asymmetry',
		src: '/products/asymmetry.png',
		href: 'https://www.asymmetry.finance/'
	},
	{
		name: 'Cap',
		src: '/products/cap.png',
		href: 'https://cap.app/'
	},
	{
		name: 'Curve Finance',
		src: '/products/curve.png',
		href: 'https://www.curve.finance/'
	},
	{
		name: 'Katana',
		src: '/products/katana.png',
		href: 'https://katana.network/'
	},
	{
		name: 'Origin Protocol',
		src: '/products/origin.png',
		href: 'https://www.originprotocol.com/'
	},
	{
		name: 'Superform',
		src: '/products/superform.png',
		href: 'https://www.superform.xyz/'
	}
];

const vaultLogos = [
	{
		name: 'Alchemix',
		src: '/vaults/alchemix.png',
		href: 'https://alchemix.fi/'
	},
	{
		name: 'Bankr',
		src: '/vaults/bankr.png',
		href: 'https://bankr.bot/'
	},
	{
		name: 'Inverse',
		src: '/vaults/inverse.png',
		href: 'https://www.inverse.finance/'
	},
	{
		name: 'Robin',
		src: '/vaults/robin.png',
		href: 'https://robin.markets/'
	},
	{
		name: 'TrueMarkets',
		src: '/vaults/truemarkets.png',
		href: 'https://truemarkets.org/'
	}
];

const	targets: TPartner[] = [
	{
		name: 'For Protocols',
		shortName: 'protocols',
		description: 'Integration platform for  effortless yield optimization',
		logo: <IconForProtocols className={'text-900'} />
	}, {
		name: 'For Organizations & Institutions',
		shortName: 'institutions',
		description: 'Infrastructure for accessing fixed yield in a compliant manner',
		logo: <IconForInstitutions className={'text-900'} />
	}, {
		name: 'For Developers',
		shortName: 'developers',
		description: 'Sandbox for novel and innovative DeFi applications',
		logo: <IconForDevelopers className={'text-900'} />
	}
];

function	Targets(): ReactElement {
	const [startIndex, setStartIndex] = useState<number>(0);
	const [isJumping, setIsJumping] = useState<boolean>(false);
	const [startIndexVaults, setStartIndexVaults] = useState<number>(0);
	const [isJumpingVaults, setIsJumpingVaults] = useState<boolean>(false);
	const visibleCount = 3;
	const totalLogos = productLogos.length;
	const totalVaultLogos = vaultLogos.length;

	useEffect((): (() => void) => {
		const intervalId = setInterval((): void => {
			setStartIndex((previous: number): number => previous + 1);
		}, 2500);

		return (): void => clearInterval(intervalId);
	}, []);

	useEffect((): (() => void) | void => {
		if (startIndex === totalLogos) {
			const timeout = setTimeout((): void => {
				setIsJumping(true);
				setStartIndex(0);
				requestAnimationFrame((): void => setIsJumping(false));
			}, 600);

			return (): void => clearTimeout(timeout);
		}
	}, [startIndex, totalLogos]);

	useEffect((): (() => void) => {
		const intervalId = setInterval((): void => {
			setStartIndexVaults((previous: number): number => previous + 1);
		}, 2500);

		return (): void => clearInterval(intervalId);
	}, []);

	useEffect((): (() => void) | void => {
		if (startIndexVaults === totalVaultLogos) {
			const timeout = setTimeout((): void => {
				setIsJumpingVaults(true);
				setStartIndexVaults(0);
				requestAnimationFrame((): void => setIsJumpingVaults(false));
			}, 600);

			return (): void => clearTimeout(timeout);
		}
	}, [startIndexVaults, totalVaultLogos]);

	const sliderLogos = useMemo(
		(): typeof productLogos => [...productLogos, ...productLogos.slice(0, visibleCount)],
		[visibleCount, totalLogos]
	);

	const sliderVaultLogos = useMemo(
		(): typeof vaultLogos => [...vaultLogos, ...vaultLogos.slice(0, visibleCount)],
		[visibleCount, totalVaultLogos]
	);

	return (
		<section aria-label={'targets'} className={'mb-28 flex flex-col space-y-8 md:mb-50 md:flex-row md:items-center md:space-y-0 md:space-x-8'}>
			<div>
				<div className={'flex flex-col space-y-4'}>
					<div className={'space-y-3'}>
						<h3 className={'text-xl font-semibold text-neutral-800'}>{'Build entire products with Yearn'}</h3>
						<div className={'mb-8 overflow-hidden rounded-2xl border-2 border-neutral-300 bg-white p-4 md:p-8'}>
							<div className={'overflow-hidden'}>
								<div
									className={'flex'}
									style={{
										transform: `translateX(-${(100 / visibleCount) * startIndex}%)`,
										transition: isJumping ? 'none' : 'transform 600ms ease-in-out'
									}}>
									{sliderLogos.map((logo, index): ReactElement => (
										<div
											key={`${logo.name}-${index}`}
											className={'flex basis-1/3 flex-shrink-0 items-center justify-center px-3'}>
											<a
												className={'flex h-full w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-3 md:p-6'}
												href={logo.href}
												target={'_blank'}
												rel={'noreferrer noopener'}>
												<Image
													alt={`${logo.name} logo`}
													src={logo.src}
													width={320}
													height={160}
													className={'h-32 w-auto object-contain md:h-28'}
												/>
											</a>
										</div>
									))}
								</div>
							</div>
						</div>
						<h3 className={'mt-8 text-xl font-semibold text-neutral-800'}>{'Embed Yearn-curated Vaults'}</h3>
						<div className={'mb-8 overflow-hidden rounded-2xl border-2 border-neutral-300 bg-white p-4 md:p-8'}>
							<div className={'overflow-hidden'}>
								<div
									className={'flex'}
									style={{
										transform: `translateX(-${(100 / visibleCount) * startIndexVaults}%)`,
										transition: isJumpingVaults ? 'none' : 'transform 600ms ease-in-out'
									}}>
									{sliderVaultLogos.map((logo, index): ReactElement => (
										<div
											key={`${logo.name}-${index}`}
											className={'flex basis-1/3 flex-shrink-0 items-center justify-center px-3'}>
											<a
												className={'flex h-full w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-3 md:p-6'}
												href={logo.href}
												target={'_blank'}
												rel={'noreferrer noopener'}>
												<Image
													alt={`${logo.name} logo`}
													src={logo.src}
													width={320}
													height={160}
													className={'h-32 w-auto object-contain md:h-28'}
												/>
											</a>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
					<h2 className={'text-3xl font-bold'}>{'Yearn Finance - Powerful & Secure Yield Optimizer'}</h2>
					<p className={'text-2xl'}>{'Permissionless DeFi base layer enabling infinite possibilities for buildooors.'}</p>
				</div>
				<div className={'mt-8 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3'}>
					{targets.map((target: TPartner): ReactElement => (
						<div
							key={target.name}
							className={'flex h-66 flex-col justify-between border-2 border-neutral-400 p-6'}>
							<div className={'h-14'}>
								{target.logo}
							</div>
							<div className={'space-y-2'}>
								<b className={'text-xl'}>{target.name}</b>
								<p>{target.description}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default Targets;
