import type {ReactElement, SVGProps} from 'react';

function	IconEarnYield(props: SVGProps<SVGSVGElement>): ReactElement {
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
			<rect x={'3.5'} y={'21'} width={'4'} height={'5'} rx={'0.75'} fill={'currentcolor'}/>
			<rect x={'10.5'} y={'17'} width={'4'} height={'9'} rx={'0.75'} fill={'currentcolor'}/>
			<rect x={'17.5'} y={'13'} width={'4'} height={'13'} rx={'0.75'} fill={'currentcolor'}/>
			<rect x={'24.5'} y={'8'} width={'4'} height={'18'} rx={'0.75'} fill={'currentcolor'}/>
		</svg>
	);
}

export default IconEarnYield;
