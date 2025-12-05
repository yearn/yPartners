import type {ReactElement, SVGProps} from 'react';

function IconCross(props: SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			viewBox={'0 0 20 20'}
			fill={'currentColor'}
			aria-hidden
			{...props}>
			<path d={'M11.414 10l5.293-5.293a1 1 0 0 0-1.414-1.414L10 8.586 4.707 3.293A1 1 0 0 0 3.293 4.707L8.586 10l-5.293 5.293a1 1 0 1 0 1.414 1.414L10 11.414l5.293 5.293a1 1 0 0 0 1.414-1.414L11.414 10Z'} />
		</svg>
	);
}

export default IconCross;
