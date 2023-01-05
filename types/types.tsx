import type	{ReactElement}	from	'react';

export type TPartnerVault = {
	address: string,
	balance: number
	bucket: string
	token: string
	tvl: number
	network: string
};

type TPartnerVaultByAddress = {
	[address: string]: TPartnerVault
}

export type TPartnerVaultsByNetwork = {
	[network: string]: TPartnerVaultByAddress
}

export type TPartnerList = {
	name: string;
	description: string;
	logo: ReactElement;
}

export type TFramerTransition = {
	y: number,
	opacity: number,
	transition: {
		delay: number,
		duration: number,
		ease: string
	}
}
