import type {ReactElement, SVGProps} from 'react';

function IconCopy(props: SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			viewBox={'0 0 20 20'}
			fill={'currentColor'}
			aria-hidden
			{...props}>
			<path d={'M15 2H7a2 2 0 0 0-2 2v1H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1h.02A1.98 1.98 0 0 0 17 11V4a2 2 0 0 0-2-2Zm-2 12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1v5a2 2 0 0 0 2 2h5v1Zm2.02-3H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1Z'} />
		</svg>
	);
}

export default IconCopy;
