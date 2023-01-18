import type	{ReactElement}	from	'react';

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
