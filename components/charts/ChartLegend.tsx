import	React		from	'react';

import type {ReactElement} from 'react';
import type {TLegendItem} from 'types/chart';

function MultiItem(props: {details: string[], color: string, isThin?: boolean}): ReactElement {
	const lines = props.details;
	const itemWidth = props.isThin ? '0.5rem' : '1rem';

	return (
		<div  className={'mb-8 -ml-8 flex flex-row'}>
			<div className={'h-5'} style={{width: itemWidth, backgroundColor: props.color}} />

			<div>
				{lines.map((line: string, idx: number): ReactElement => (
					<p key={`line-${idx}`} className={'ml-2 text-xs underline md:text-sm'}>{line}</p>
				))} 
			</div>
		</div> 
	);
}


function SingleItem(props: {details: string, color: string, isThin?: boolean}): ReactElement {
	const itemName = props.details;
	const itemWidth = props.isThin ? '0.5rem' : '1rem';

	return (
		<div className={'mb-8 -ml-8 flex flex-row'}>
			<div className={'h-5 w-4'} style={{width: itemWidth, backgroundColor: props.color}} />
			<p className={'ml-2 text-xs underline md:text-sm'}>{itemName}</p>
		</div> 
	);
}


function ChartLegend(props: {items: TLegendItem[] }): ReactElement {
	return (
		<div className={'-mt-8 ml-4 flex h-full w-[15%] flex-col items-start justify-center'}>
			{props.items.map((item: TLegendItem, idx: number): ReactElement => {
				const {type, details, color, isThin} = item;

				return (type === 'multi' ? 
					<MultiItem
						key={idx}
						color={color}
						details={details as string[]}
						isThin={isThin} /> 
					: <SingleItem
						key={idx}
						color={color}
						details={details as string}
						isThin={isThin} /> );
			})}
		</div>
	);
}

export default ChartLegend;