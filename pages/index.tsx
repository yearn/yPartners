import	React, {ReactElement}	from	'react';
import	Image					from	'next/image';
import	{Button}				from	'@yearn-finance/web-lib/components';
import	IconForProtocols		from	'components/icons/IconForProtocols';
import	IconForDevelopers		from	'components/icons/IconForDevelopers';
import	IconForInstitutions		from	'components/icons/IconForInstitutions';
import	LogoQiDAO				from	'components/icons/partners/LogoQiDAO';
import	LogoElement				from	'components/icons/partners/LogoElement';
import	LogoBrave				from	'components/icons/partners/LogoBrave';
import	LogoMIM					from	'components/icons/partners/LogoMIM';
import	LogoLedger				from	'components/icons/partners/LogoLedger';
import	LogoAlchemix			from	'components/icons/partners/LogoAlchemix';
import	LogoGearbox				from	'components/icons/partners/LogoGearbox';
import	LogoInverse				from	'components/icons/partners/LogoInverse';
import	LogoZooDao				from	'components/icons/partners/LogoZooDAO';

function	Index(): ReactElement {
	return (
		<main>
			<section aria-label={'hero'} className={'grid grid-cols-12 items-center mt-[85px] mb-28'}>
				<div className={'col-span-12 md:col-span-8'}>
					<h1 className={'mb-6 text-6xl md:text-8xl text-neutral-900'}>{'Yearn Partners'}</h1>
					<p className={'text-lg'}>{'Integrate Yearn vaults to earn up to 50 % profit share'}</p>
					<div className={'flex flex-row mt-4 space-x-4'}>
						<Button className={'w-[200px]'}>
							{'Apply'}
						</Button>
						<Button className={'w-[200px]'} variant={'outlined'}>
							{'Learn More'}
						</Button>

					</div>
				</div>
				<div className={'hidden col-span-4 md:block'}>
					<Image src={'/b2bmeme.svg'} loading={'eager'} width={420} height={445} />
				</div>
			</section>
		
			<section aria-label={'stats'} className={'flex flex-row flex-wrap items-center mb-28 md:mb-50'}>
				<div className={'flex flex-col pr-5 mt-4 mr-4 space-y-2 md:mt-0 md:mr-8'}>
					<p>{'TVL by all Partners'}</p>
					<b className={'text-3xl'}>{'$ 69,125,743.68'}</b>
				</div>
				<div className={'flex flex-col pr-5 mt-4 mr-4 space-y-2 md:mt-0 md:mr-8'}>
					<p>{'Fees earned by Partners'}</p>
					<b className={'text-3xl'}>{'$ 420,743.68'}</b>
				</div>
				<div className={'flex flex-col pr-5 mt-4 mr-8 space-y-2 md:mt-0'}>
					<p>{'Share of Revenue'}</p>
					<b className={'text-3xl'}>{'15 %'}</b>
				</div>
				<div className={'flex flex-col pr-5 mt-4 space-y-2 md:mt-0'}>
					<p>{'Partners'}</p>
					<b className={'text-3xl'}>{'9'}</b>
				</div>
			</section>

			<section aria-label={'targets'} className={'flex flex-row items-center mb-28 space-x-8 md:mb-50'}>
				<div>
					<div className={'flex flex-col space-y-4'}>
						<h2 className={'text-3xl font-bold'}>{'Yearn Finance - Powerful & Secure Yield Optimizer'}</h2>
						<p className={'text-xl'}>{'Permissionless DeFi base layer enabling infinite possibilities for buildooors.'}</p>
					</div>
					<div className={'grid grid-cols-1 gap-8 mt-10 w-full max-w-5xl md:grid-cols-3'}>
						<div className={'p-6 border-2 border-neutral-400'}>
							<div className={'mb-24'}>
								<IconForProtocols className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'For Protocols'}</b>
								<p>{'Integration platform for  effortless yield optimization'}</p>
							</div>
						</div>
						<div className={'p-6 border-2 border-neutral-400'}>
							<div className={'mb-24'}>
								<IconForDevelopers className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'For Developers'}</b>
								<p>{'Sandbox for novel and innovative DeFi applications'}</p>
							</div>
						</div>
						<div className={'p-6 border-2 border-neutral-400'}>
							<div className={'mb-24'}>
								<IconForInstitutions className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'For Organizations & Institutions'}</b>
								<p>{'Infrastructure for accessing fixed yield in a compliant manner'}</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section aria-label={'partners'} className={'flex flex-row items-center mb-28 space-x-8 md:mb-50'}>
				<div>
					<div>
						<h2 className={'text-3xl font-bold'}>{'Built on Yearn'}</h2>
					</div>
					<div className={'grid grid-cols-1 gap-8 mt-8 w-full max-w-5xl md:grid-cols-3'}>
						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoQiDAO className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'QiDAO'}</b>
								<p>{'A stablecoin protocol utilizing collateralized debt positions'}</p>
							</div>
						</div>
						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoElement className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'Element Finance'}</b>
								<p>{'An open source protocl for fixed and variable yield markets'}</p>
							</div>
						</div>
						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoBrave className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'Brave'}</b>
								<p>{'Fast, private, secure web browser for PC, Mac, and mobile'}</p>
							</div>
						</div>

						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoMIM className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'Abracadabra'}</b>
								<p>{'A decentralized crypto lending platform '}</p>
							</div>
						</div>
						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoLedger className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'Ledger'}</b>
								<p>{'An application to quickly and securely manage their assets'}</p>
							</div>
						</div>
						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoAlchemix className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'Alchemix'}</b>
								<p>{'Self-repaying loans without risk of liquidation'}</p>
							</div>
						</div>

						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoGearbox className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'Gearbox'}</b>
								<p>{'A generalized leverage protocol'}</p>
							</div>
						</div>
						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoInverse className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'Inverse Finance'}</b>
								<p>{'An open source protocol for borrowing and lending assets'}</p>
							</div>
						</div>
						<div className={'flex flex-col justify-between p-6 h-66 border-2 border-neutral-200 bg-neutral-200'}>
							<div className={'h-14'}>
								<LogoZooDao className={'text-900'} />
							</div>
							<div className={'space-y-2'}>
								<b className={'text-lg'}>{'ZooDAO'}</b>
								<p>{'A platform that allows users to earn passive income from NFTs'}</p>
							</div>
						</div>

					</div>
				</div>
			</section>
		</main>
	);
}

export default Index;
