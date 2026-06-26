import type {ReactElement, SVGProps} from 'react';

function	IconManagedVaults(props: SVGProps<SVGSVGElement>): ReactElement {
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
				d={'M6 6 H26 V26 H6 Z M9 9 H23 V23 H9 Z'}
				fill={'currentcolor'}/>
			<circle cx={'16'} cy={'16'} r={'3.5'} fill={'currentcolor'}/>
			<rect x={'12.5'} y={'15.2'} width={'7'} height={'1.6'} rx={'0.8'} fill={'currentcolor'}/>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={'M30 7 A5 5 0 1 1 20 7 A5 5 0 1 1 30 7 Z M21.8 7.5 L23.9 9.6 L28.2 5.1 L27.2 4.1 L23.9 7.5 L22.7 6.2 Z'}
				fill={'currentcolor'}/>
		</svg>
	);
}

export default IconManagedVaults;
