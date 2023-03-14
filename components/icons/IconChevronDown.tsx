import	React		from	'react';

import type {ReactElement, SVGProps} from 'react';

function	IconChevronDown(props: SVGProps<SVGSVGElement>): ReactElement {
	const defaultProps = {
		width: 17,
		height: 11
	};

	props = {...defaultProps, ...props};

	return (
		<svg
			viewBox={'0 0 17 11'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}
			{...props}>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={'M16.4284 1.02166C16.844 1.38536 16.8861 2.01715 16.5225 2.43275L9.52252 10.4328C9.33262 10.6498 9.05822 10.7743 8.76992 10.7743C8.48152 10.7743 8.20722 10.6498 8.01732 10.4328L1.01733 2.43275C0.653652 2.01715 0.695772 1.38536 1.1114 1.02166C1.52704 0.658056 2.1588 0.700155 2.52248 1.11576L8.76992 8.25568L15.0173 1.11576C15.381 0.700155 16.0128 0.658056 16.4284 1.02166Z'}
				fill={'black'}/>
		</svg>

	);
}

export default IconChevronDown;

