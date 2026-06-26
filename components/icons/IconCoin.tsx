import type {ReactElement, SVGProps} from 'react';

function	IconCoin(props: SVGProps<SVGSVGElement>): ReactElement {
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
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={'M27 16 A11 11 0 1 1 5 16 A11 11 0 1 1 27 16 Z M24.5 16 A8.5 8.5 0 1 0 7.5 16 A8.5 8.5 0 1 0 24.5 16 Z M23.5 16 A7.5 7.5 0 1 1 8.5 16 A7.5 7.5 0 1 1 23.5 16 Z'}
				fill={'currentcolor'}/>
		</svg>
	);
}

export default IconCoin;
