import type {ReactElement, SVGProps} from 'react';

function	IconFundCause(props: SVGProps<SVGSVGElement>): ReactElement {
	const defaultProps = {
		width: 32,
		height: 32
	};

	props = {...defaultProps, ...props};

	return (
		<svg
			viewBox={'0 0 32 32'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}
			{...props}>
			<path
				d={'M16 26 C 6 18, 6 8, 12 8 C 14 8, 16 10, 16 12 C 16 10, 18 8, 20 8 C 26 8, 26 18, 16 26 Z'}
				fill={'currentcolor'}/>
		</svg>
	);
}

export default IconFundCause;
