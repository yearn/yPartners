import type {ReactElement, SVGProps} from 'react';

function	IconMarketplace(props: SVGProps<SVGSVGElement>): ReactElement {
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
				d={'M5 5 L27 5 L27 11 L23 13.5 L19 11 L15 13.5 L11 11 L7 13.5 L5 11 Z'}
				fill={'currentcolor'}/>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={'M7 13 H25 V26 H7 Z M9.5 15.5 H22 V23.5 H9.5 Z'}
				fill={'currentcolor'}/>
			<rect x={'11'} y={'17'} width={'4'} height={'4'} rx={'0.75'} fill={'currentcolor'}/>
			<rect x={'16.5'} y={'17'} width={'4'} height={'4'} rx={'0.75'} fill={'currentcolor'}/>
		</svg>
	);
}

export default IconMarketplace;
