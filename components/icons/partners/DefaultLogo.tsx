import	React		from	'react';

import type {ReactElement, SVGProps} from 'react';

function	DefaultLogo(props: SVGProps<SVGSVGElement>): ReactElement {
	const defaultProps = {
		width: 40,
		height: 40
	};

	props = {...defaultProps, ...props};

	return (
		<svg
			width={'40'}
			height={'40'}
			viewBox={'0 0 40 40'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}
			{...props}
		>          
			<circle
				cx={'20'}
				cy={'20'}
				r={'20'}
				fill={'#D9D9D9'}/>
		</svg>
	);
}

export default DefaultLogo;
