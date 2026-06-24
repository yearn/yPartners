import Image from 'next/image';

import type {ReactElement} from 'react';

const	partnerLogos = [
	{
		name: 'Asymmetry',
		src: '/partner-logos-dark/Asymmetry_Finance_Logo_Light.svg',
		href: 'https://www.asymmetry.finance/'
	},
	{
		name: 'Cap',
		src: '/partner-logos-dark/cap.svg',
		href: 'https://cap.app/'
	},
	{
		name: 'Curve Finance',
		src: '/partner-logos-dark/Curve.svg',
		href: 'https://www.curve.finance/'
	},
	{
		name: 'Katana',
		src: '/partner-logos-dark/katana_logo_primary_lockup_spark.svg',
		href: 'https://katana.network/'
	},
	{
		name: 'Origin Protocol',
		src: '/partner-logos-dark/Origin.svg',
		href: 'https://www.originprotocol.com/'
	},
	{
		name: 'Superform',
		src: '/partner-logos-dark/Superform.svg',
		href: 'https://www.superform.xyz/'
	},
	{
		name: 'Teller',
		src: '/partner-logos-dark/teller-logo.svg',
		href: 'https://www.teller.org/'
	},
	{
		name: 'Alchemix',
		src: '/partner-logos-dark/Alchemix_Black.svg',
		href: 'https://alchemix.fi/'
	},
	{
		name: 'Bankr',
		src: '/partner-logos-dark/bankr-symbol-full-color-rgb.svg',
		href: 'https://bankr.bot/'
	},
	{
		name: 'Inverse',
		src: '/partner-logos-dark/Inverse_Finance_Logo_05.svg',
		href: 'https://www.inverse.finance/'
	},
	{
		name: 'Robin',
		src: '/partner-logos-dark/robin.svg',
		href: 'https://robin.markets/'
	},
	{
		name: 'Trueo',
		src: '/partner-logos-dark/trueo-logo.svg',
		href: 'https://trueo.com/'
	},
	{
		name: 'Octant',
		src: '/partner-logos-dark/Octant-logo.svg',
		href: 'https://octant.build/'
	},
	{
		name: 'Term',
		src: '/partner-logos-dark/Term.svg',
		href: 'https://www.term.finance/'
	},
	{
		name: 'Sturdy',
		src: '/partner-logos-dark/sturdy.svg',
		href: 'https://sturdy.finance/'
	},
	{
		name: 'Swell',
		src: '/partner-logos-dark/swell-light.svg',
		href: 'https://www.swellnetwork.io/'
	},
	{
		name: 'Birch Hill',
		src: '/partner-logos-dark/birch-hill-logo.svg',
		href: 'https://www.birchhill.io/'
	}
];

function	PartnerLogos(): ReactElement {
	return (
		<section aria-label={'partner-logos'} className={'mb-28 md:mb-50'}>
			<h3 className={'mb-3 text-xl font-semibold text-neutral-800'}>{'Trusted by teams building on Yearn'}</h3>
			<div className={'partner-marquee__viewport relative w-full overflow-hidden'}>
				<div className={'partner-marquee__track'}>
					{[...partnerLogos, ...partnerLogos].map((logo, index): ReactElement => (
						<a
							key={`${logo.name}-${index}`}
							className={'flex flex-none items-center justify-center px-[1.125rem] opacity-70 transition-opacity duration-300 hover:opacity-100 md:px-7'}
							href={logo.href}
							target={'_blank'}
							rel={'noreferrer noopener'}>
							<div className={'relative h-10 w-32 md:h-12 md:w-48'}>
								<Image
									alt={`${logo.name} logo`}
									src={logo.src}
									fill
									className={'object-contain'}
								/>
							</div>
						</a>
					))}
				</div>
			</div>
		</section>
	);
}

export default PartnerLogos;
