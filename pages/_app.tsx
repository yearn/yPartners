import {useEffect, useMemo, useState} from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {DefaultSeo} from 'next-seo';
import {AuthContextApp, useAuth} from 'contexts/useAuth';
import {YearnContextApp} from 'contexts/useYearn';
import {PARTNERS, SHAREABLE_ADDRESSES} from 'utils/Partners';
import {Button} from 'lib/yearn/components/Button';
import {Card} from 'lib/yearn/components/Card';
import {Modal} from 'lib/yearn/components/Modal';
import {yToast} from 'lib/yearn/components/yToast';
import {WithYearn} from 'lib/yearn/contexts/WithYearn';
import {isZeroAddress, toAddress} from 'lib/yearn/utils/address';
import performBatchedUpdates from 'lib/yearn/utils/performBatchedUpdates';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';
import type {TAddress} from 'lib/yearn/utils/address';

import '../style.css';

function	AppHead(): ReactElement {
	return (
		<>
			<Head>
				<title>{process.env.WEBSITE_NAME}</title>
				<meta httpEquiv={'X-UA-Compatible'} content={'IE=edge'} />
				<meta name={'viewport'} content={'width=device-width, initial-scale=1'} />
				<meta name={'description'} content={process.env.WEBSITE_NAME} />
				<meta name={'msapplication-TileColor'} content={'#000000'} />
				<meta name={'theme-color'} content={'#000000'} />

				<link
					rel={'shortcut icon'}
					type={'image/x-icon'}
					href={'/favicons/favicon.ico'} />
				<link
					rel={'apple-touch-icon'}
					sizes={'180x180'}
					href={'/favicons/apple-touch-icon.png'} />
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'32x32'}
					href={'/favicons/favicon-32x32.png'} />
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'16x16'}
					href={'/favicons/favicon-16x16.png'} />
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'192x192'}
					href={'/favicons/android-chrome-192x192.png'} />
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'512x512'}
					href={'/favicons/android-chrome-512x512.png'} />

				<meta name={'robots'} content={'index,nofollow'} />
				<meta name={'googlebot'} content={'index,nofollow'} />
				<meta charSet={'utf-8'} />
			</Head>
			<DefaultSeo
				title={process.env.WEBSITE_NAME}
				defaultTitle={process.env.WEBSITE_NAME}
				description={process.env.WEBSITE_DESCRIPTION}
				openGraph={{
					type: 'website',
					locale: 'en_US',
					url: process.env.WEBSITE_URI,
					site_name: process.env.WEBSITE_NAME,
					title: process.env.WEBSITE_NAME,
					description: process.env.WEBSITE_DESCRIPTION,
					images: [
						{
							url: `${process.env.WEBSITE_URI}og.png`,
							width: 1200,
							height: 675,
							alt: 'Yearn'
						}
					]
				}}
				twitter={{
					handle: '@iearnfinance',
					site: '@iearnfinance',
					cardType: 'summary_large_image'
				}} />
		</>
	);
}

function	AppHeader(): ReactElement {
	const	router = useRouter();
	const {toast} = yToast();
	const	{hasModal, isLoggedIn, isLoading, set_hasModal, set_isLoggedIn, set_isLoading} = useAuth();
	const	[authOption, set_authOption] = useState('Log in');
	const	[address, set_address] = useState<TAddress | undefined>(undefined);

	const slug = (router.query.partnerID as TAddress) || undefined;

	useEffect((): void => {
		if(!isZeroAddress(toAddress(slug)) && SHAREABLE_ADDRESSES?.[slug]){
			performBatchedUpdates((): void => {
				set_address(slug);
				set_isLoggedIn(true);
				set_authOption('Log out');
			});
		}
	}, [set_isLoggedIn, slug]);

	return (
		<header>
			<div className={'flex w-full flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between'}>
				<nav className={'flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:flex-nowrap md:gap-y-0 md:gap-x-10 md:text-base'}>
					{!isLoggedIn && (
						<>
							<div>
								<Link href={'/'}>
									<p
										aria-selected={router.pathname === '/'}
										className={'project--nav'}>
										{'Main'}
									</p>
								</Link>
							</div>
							<div>
								<Link href={'/team-up'}>
									<p
										aria-selected={router.pathname === '/team-up'}
										className={'project--nav'}>
										{'Team up'}
									</p>
								</Link>
							</div>
							<div>
								<Link href={'/learn-more'}>
									<p
										aria-selected={router.pathname === '/learn-more'}
										className={'project--nav'}>
										{'Learn more'}
									</p>
								</Link>
							</div>
						</>
					)}
				</nav>

				<div className={'flex w-full flex-row items-center md:w-auto md:justify-end'}>
					<Button
						variant={'filled'}
						className={'!h-[30px] w-full md:w-auto'}
						onClick={(): void => {
							if(isLoggedIn && address){
								performBatchedUpdates((): void => {
									set_address(undefined);
									set_isLoggedIn(false);
									set_authOption('Log in');
								});

								router.push('/');
							} else {
								set_hasModal(!hasModal);
							}
						}}>
						{authOption}
					</Button>
				</div>

			</div>

			<Modal
				isOpen={hasModal}
				onClose={(): void => {
					if(!isLoading){
						set_hasModal(false);
					}
				}}>
				<Card>
					{isLoading ? (<h1 className={'mb-5'}>{'Loading Dashboard...'}</h1>) : (
						<>
							<h1 className={'mb-7'}>{'Log in'}</h1>
							<WrappedInput
								title={'Project Address'}
								initialValue={''}
								onSave={(addr): void => {
									const address = toAddress(addr);
									let isMatched = false;

									Object.values(PARTNERS).forEach((partner): void => {
										if (partner.treasury?.includes(address)) {
											isMatched = true;
											const idx = partner.treasury?.indexOf(address);
											
											performBatchedUpdates((): void => {
												set_isLoading(true);
												set_address(partner.treasury?.[idx] as TAddress || undefined);
												set_isLoggedIn(true);
												set_authOption('Log out');
											});											

											router.push(`dashboard/${partner.treasury[0]}`).then((): void => {
												performBatchedUpdates((): void => {
													set_hasModal(false);
													setTimeout((): void => set_isLoading(false), 1000);
												});			
											});
										}
									});

									if (!isMatched){
										toast({
											type: 'warning',
											content: 'That address isn\'t associated with any dashboard. Reach out to us if you believe this is a mistake.',
											duration: 10000
										});
									}

								} } />
						</>
					)}

				</Card>
			</Modal>
		</header>
	);
}

function	AppWrapper(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;


	return (
		<>
			<AppHead />
			<div id={'app'} className={'mx-auto mb-0 grid max-w-6xl grid-cols-12 flex-col gap-x-4 md:flex-row'}>
				<div className={'col-span-12 flex min-h-[100vh] w-full flex-col px-4 sm:px-6 lg:px-0'}>
					<AppHeader />
					<Component
						key={router.route}
						router={props.router}
						{...pageProps} />
				</div>
			</div>
		</>
	);
}

function	MyApp(props: AppProps): ReactElement {
	const	{Component, pageProps} = props;

	return (
		<WithYearn>
			<YearnContextApp>
				<AuthContextApp>
					<AppWrapper
						Component={Component}
						pageProps={pageProps}
						router={props.router} />
				</AuthContextApp>
			</YearnContextApp>
		</WithYearn>
	);
}

export default MyApp;

type TWrappedInput = {
	title: string;
	initialValue: string;
	onSave: (value: string) => void;
}

function	WrappedInput({title, initialValue, onSave}: TWrappedInput): ReactElement {
	const	[isFocused, set_isFocused] = useState(false);
	const	[value, set_value] = useState(initialValue);
	const	isInitialValue = useMemo((): boolean => value === initialValue, [value, initialValue]);

	return (
		<label>
			<p className={'pb-1 text-neutral-900'}>{title}</p>
			<div className={'grid-col-1 grid items-end space-y-2 md:flex md:flex-row md:space-x-2'}>
				<div data-focused={isFocused} className={'yearn--input relative w-full'}>
					<input
						onFocus={(): void => set_isFocused(true)}
						onBlur={(): void => set_isFocused(false)}
						className={'h-10 w-full overflow-x-scroll border-2 border-neutral-700 bg-neutral-0 p-2 outline-none scrollbar-none'}
						placeholder={'0x...'}
						value={value}
						type={'text'}
						onChange={(e): void => set_value(e.target.value)}
					/>
				</div>
				<Button
					disabled={isInitialValue || value.length !== 42}
					className={'w-full text-sm md:w-48'}
					onClick={(): void => onSave(value)}>
					{'View Dashboard'}
				</Button>
			</div>
		</label>
	);
}
