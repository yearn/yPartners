import type {ReactElement} from 'react';
import type {SVGProps} from 'react';

function DefaultLogo(props: SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 512 512'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<rect width={'512'} height={'512'} rx={'256'} fill={'currentColor'} fillOpacity={'0.1'} />
			<path
				d={'M256 144C194.1 144 144 194.1 144 256C144 317.9 194.1 368 256 368C317.9 368 368 317.9 368 256C368 194.1 317.9 144 256 144ZM256 336C211.8 336 176 300.2 176 256C176 211.8 211.8 176 256 176C300.2 176 336 211.8 336 256C336 300.2 300.2 336 256 336Z'}
				fill={'currentColor'}
			/>
		</svg>
	);
}

export default DefaultLogo;
