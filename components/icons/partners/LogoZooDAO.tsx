import	React		from	'react';

import type {ReactElement, SVGProps} from 'react';

function	LogoZooDao(props: SVGProps<SVGSVGElement>): ReactElement {
	const defaultProps = {
		width: 40,
		height: 34
	};

	props = {...defaultProps, ...props};

	return (
		<svg
			viewBox={'0 0 40 34'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}
			{...props}>
			<mask
				id={'mask0_1024_707'}
				style={{maskType: 'alpha'}}
				maskUnits={'userSpaceOnUse'}
				x={'0'}
				y={'0'}
				width={'40'}
				height={'34'}>
				<path d={'M0 0V9.63336H22.9133L0 24.3667V34H40V24.3667H17.0869L40 9.63336V0H0Z'} fill={'black'}/>
			</mask>
			<g mask={'url(#mask0_1024_707)'}>
				<path d={'M6.0885 -10.8679L23.1157 72.51L50.6492 61.3605L6.0885 -10.8679Z'} fill={'currentcolor'}/>
				<path d={'M16.055 -26.6152L52.5754 64.213L81.454 45.7621L16.055 -26.6152Z'} fill={'currentcolor'}/>
				<path d={'M0.468374 -5.03418L-23.6098 89.9459L10.4541 92.4971L0.468374 -5.03418Z'} fill={'currentcolor'}/>
			</g>
		</svg>
	);
}

export default LogoZooDao;



