
import	React, {ReactElement}		from	'react';
// import	{unstable_getServerSession}	from 	'next-auth/next';
import	{Button}					from	'@yearn-finance/web-lib/components';
// import	{authOptions}				from	'pages/api/auth/[...nextauth]';
import {usePartner} from 'contexts/usePartner';

function	Index(): ReactElement {
	const	{partner, logo} = usePartner();

	return (
		<main>
			<section aria-label={'hero'} className={'grid grid-cols-12 mt-[85px] mb-28'}>
				<div className={'col-span-12 md:col-span-8'}>
					<h1 className={'mb-2 text-6xl text-neutral-900 md:text-8xl'}>{partner}</h1>
					<p className={'mb-20 w-3/4 text-neutral-500'}>{'Last updated October 28th 2022, 16:20'}</p>
					<div className={'flex flex-row mt-4 space-x-4'}>
						<Button className={'w-[200px]'}>
							{'Hello'}
						</Button>
						<Button className={'w-[200px]'} variant={'outlined'}>
							{'You you you!'}
						</Button>

					</div>
				</div>

				<div className={'hidden col-span-3 md:block'}>
					{logo?.current}
				</div>
			</section>
		</main>
	);
}

// export async function getServerSideProps(context: any): Promise<any> {
// 	const session = await unstable_getServerSession(context.req, context.res, authOptions);
// 	if (!session) {
// 		return {
// 			redirect: {
// 				destination: '/',
// 				permanent: false
// 			}
// 		};
// 	}
  
// 	return {props: {session}};
// }

export default Index;
