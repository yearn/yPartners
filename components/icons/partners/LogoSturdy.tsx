import	React		from	'react';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & {isColored?: boolean};

function	LogoSturdy(props: TLogo): ReactElement {
	const defaultProps = {
		width: 28,
		height: 40
	};

	props = {...defaultProps, ...props};

	return props.isColored ? (
		<svg
			viewBox={'0 0 272 272'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<circle
				cx={'136'}
				cy={'136'}
				r={'136'}
				fill={'#0D142D'}/>
			<path d={'M106.556 195.294L124.079 213L165.157 171.493L147.634 153.786L106.556 195.294ZM153.954 147.401L171.477 165.107L189 147.401L171.477 129.695L153.954 147.401ZM165.157 75.706L147.634 58L106.556 99.5075L124.079 117.214L165.157 75.706ZM124.079 165.107L165.157 123.599L147.634 105.893L106.556 147.401L124.079 165.107ZM100.523 105.893L83 123.599L100.523 141.305L118.046 123.599L100.523 105.893Z'} fill={'white'}/>
		</svg>
	) : (
		<svg
			viewBox={'0 0 28 40'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}
			{...props}>
			<path d={'M6.07884 35.4307L10.6009 40L21.2018 29.2884L16.6798 24.7191L6.07884 35.4307ZM18.3107 23.0711L22.8328 27.6404L27.3548 23.0711L22.8328 18.5019L18.3107 23.0711ZM21.2018 4.56929L16.6798 0L6.07884 10.7116L10.6009 15.2809L21.2018 4.56929ZM10.6009 27.6404L21.2018 16.9288L16.6798 12.3596L6.07884 23.0711L10.6009 27.6404ZM4.52207 12.3596L0 16.9288L4.52207 21.4981L9.04413 16.9288L4.52207 12.3596Z'} fill={'black'}/>
		</svg>
	);
}

export default LogoSturdy;



