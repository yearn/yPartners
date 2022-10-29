import	React, {ReactElement}		from	'react';
import	{Button}					from	'@yearn-finance/web-lib/components';

function	Overview(): ReactElement {
	return (
		<div className={'mt-6 h-[400px]'}>
			<div className={'flex flex-row mt-4 space-x-4'}>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'1 day'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'1 week'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'filled'}>
					{'1 month'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'1 year'}
				</Button>
				<Button className={'w-[90px] text-xs md:w-[100px] md:text-base'} variant={'outlined'}>
					{'All time'}
				</Button>
			</div>

			<div className={'flex justify-center items-center mt-6 mb-12  h-[350px] bg-good-ol-grey-300'}>
				<h1>{'Chart Placeholder'}</h1>
			</div>
		</div>
	);
}

export default Overview;
