import	React, {ReactElement}		from	'react';
import	Image						from	'next/image';
import	{unstable_getServerSession}	from 	'next-auth/next';
import	{Button}					from	'@yearn-finance/web-lib/components';
import	{authOptions}				from	'pages/api/auth/[...nextauth]';

function	Index({session}: any): ReactElement {
	return (
		<main>
			<section aria-label={'hero'} className={'grid grid-cols-12 items-center mt-[85px] mb-28'}>
				<div className={'col-span-12 md:col-span-8'}>
					<h1 className={'mb-6 text-6xl text-neutral-900 md:text-8xl'}>{'Hello You!'}</h1>
					<p className={'w-3/4 text-lg'}>{`Your ID is ${session.user.name} and your token expires the ${session.expires}`}</p>
					<div className={'flex flex-row mt-4 space-x-4'}>
						<Button className={'w-[200px]'}>
							{'Hello'}
						</Button>
						<Button className={'w-[200px]'} variant={'outlined'}>
							{'You you you!'}
						</Button>

					</div>
				</div>
				<div className={'hidden col-span-4 md:block'}>
					<Image
						src={'/b2bmeme.svg'}
						loading={'eager'}
						width={420}
						height={445} />
				</div>
			</section>
		</main>
	);
}

export async function getServerSideProps(context: any): Promise<any> {
	const session = await unstable_getServerSession(context.req, context.res, authOptions);
	if (!session) {
		return {
			redirect: {
				destination: '/',
				permanent: false
			}
		};
	}
  
	return {props: {session}};
}

export default Index;
