import type {ReactElement, SVGProps} from 'react';

function IconLinkOut(props: SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			viewBox={'0 0 20 20'}
			fill={'currentColor'}
			aria-hidden
			{...props}>
			<path d={'M11 3a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.414l-8.293 8.293a1 1 0 0 1-1.414-1.414L14.586 3H11Z'} />
			<path d={'M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 1 2 0v3a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h3a1 1 0 1 1 0 2H5Z'} />
		</svg>
	);
}

export default IconLinkOut;
