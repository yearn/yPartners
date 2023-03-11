import	React		from	'react';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & {isColored?: boolean};

function	LogoYieldster(props: TLogo): ReactElement {
	const defaultProps = {
		width: 40,
		height: 40
	};

	props = {...defaultProps, ...props};

	return props.isColored ? (
		<svg
			viewBox={'0 0 80 80'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path d={'M40 0C17.9094 0 0 17.9094 0 40C0 62.0906 17.9094 80 40 80C62.0906 80 80 62.0906 80 40C79.9303 17.9094 62.0209 0 40 0Z'} fill={'#09172E'}/>
			<path d={'M59.8298 21.967H59.7426V20L41.915 32.9723L40.334 42.023L38.7404 32.9474L21 20V45.2474L40.3589 60L59.7426 45.6956V22.1413L59.8298 21.967ZM40.3215 51.1236L43.3343 33.8811L57.1033 23.8095L40.2966 57.2113L23.8634 24.0461L37.3087 33.8313L40.3215 51.1236ZM22.5562 24.9798L38.118 56.3897L22.5562 44.4631V24.9798ZM58.1864 44.8988L42.3757 56.5764L58.1864 25.2288V44.8988Z'} fill={'white'}/>
		</svg>
	):(
		<svg
			viewBox={'0 0 39 40'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}
			{...props}>
			<path d={'M38.8298 1.96701H38.7426V0L20.915 12.9723L19.334 22.023L17.7404 12.9474L0 0V25.2474L19.3589 40L38.7426 25.6956V2.1413L38.8298 1.96701ZM19.3215 31.1236L22.3343 13.8811L36.1033 3.80952L19.2966 37.2113L2.86337 4.04606L16.3087 13.8313L19.3215 31.1236ZM1.55618 4.97977L17.118 36.3897L1.55618 24.4631V4.97977ZM37.1864 24.8988L21.3757 36.5764L37.1864 5.22876V24.8988Z'} fill={'black'}/>
		</svg>
	);
}

export default LogoYieldster;
