
import	React, {ReactElement}		from	'react';
import	{Button, Card}					from	'@yearn-finance/web-lib/components';
import Overview from 'components/dashboard/Overview';
import {usePartner} from 'contexts/usePartner';

function	Index(): ReactElement {
	const	{partner, logo} = usePartner();

	return (
		<main>
			<section aria-label={'hero'} className={'grid grid-cols-12 mt-[75px] mb-14'}>
				<div className={'col-span-12 md:col-span-7'}>
					<h1 className={'mb-2 text-6xl text-neutral-900 md:text-8xl'}>{partner}</h1>
					<p className={'mb-10 w-3/4 text-neutral-500'}>{'Last updated October 31st 2022, 16:20'}</p>
					<div className={'flex flex-row items-end mt-2 space-x-4'}>
						<div>
							<label className={'block text-neutral-500'} htmlFor={'start'}>{'From'}</label>
							<input
								className={'text-neutral-500'}
								type={'date'}
								id={'start'}
								name={'range-start'}
								value={'2022-07-22'}
								min={'2022-01-01'}
								max={'2022-12-31'} />
						</div>

						<div>
							<label className={'block text-neutral-500'} htmlFor={'end'}>{'To'}</label>
							<input
								className={'text-neutral-500'}
								type={'date'}
								id={'end'}
								name={'range-end'}
								value={'2022-10-31'}
								min={'2022-01-01'}
								max={'2022-12-31'} />
						</div>

					
						<Button className={'w-[200px] text-sm  md:text-base'} variant={'filled'}>
							{'Download Report'}
						</Button>

					</div>
				</div>

				<div className={'hidden col-span-1 md:block'} />

				<div className={'hidden col-span-3 md:block'}>
					{logo?.current}
				</div>

				<div className={'hidden col-span-2 md:block'} />
			</section>

			<section aria-label={'tabs'} className={'grid grid-cols-12 mb-7'}>
				<div className={'col-span-12 w-full'}>
					<Card.Tabs
						tabs={[
							{label: 'Overview', children: <Overview/>},
							{label: 'Vault 1', children: <Overview/>},
							{label: 'Vault 2', children: <Overview/>},
							{label: 'Vault 3', children: <Overview/>}
						]}
					/>
				</div>
			</section>
		</main>
	);
}

export default Index;
