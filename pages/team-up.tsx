import axios from 'axios';
import {useRef, useState} from 'react';

import type {FormEvent, ReactElement} from 'react';

type TFormResponse = {
	isError: boolean;
	message: string;
}

function	TeamUpPage(): ReactElement {
	const [isBusy, setIsBusy] = useState(false);
	const [isDisabled, setIsDisabled] = useState(false);
	const [response, setResponse] = useState<TFormResponse | null>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		if (isBusy || isDisabled) {
			return;
		}

		setIsBusy(true);
		setIsDisabled(true);
		setResponse(null);

		const formData = {
			name: (event.currentTarget.elements.namedItem('name') as HTMLInputElement)?.value,
			tguser: (event.currentTarget.elements.namedItem('tguser') as HTMLInputElement)?.value,
			protocol: (event.currentTarget.elements.namedItem('protocol') as HTMLInputElement)?.value,
			website: (event.currentTarget.elements.namedItem('website') as HTMLInputElement)?.value,
			message: (event.currentTarget.elements.namedItem('message') as HTMLTextAreaElement)?.value
		};

		try {
			await axios.post('/api/telegram', formData);
			setResponse({
				isError: false,
				message: 'Thank you for your message. We will get back to you as soon as possible!'
			});
			formRef.current?.reset();
		} catch (error) {
			const apiMessage = (error as {response?: {data?: {error?: string}}})?.response?.data?.error;
			setResponse({
				isError: true,
				message: apiMessage || 'We are sorry, but something went wrong. Please try again later.'
			});
		} finally {
			setIsBusy(false);
			setTimeout((): void => setIsDisabled(false), 10000);
		}
	};

	return (
		<div className={'w-full bg-neutral-200 p-6'}>
			<div className={'mx-auto max-w-screen-lg space-y-8 p-2 sm:p-4'}>
				<div className={'space-y-4'}>
					<h1 className={'text-3xl font-bold'}>{'Let’s Team Up!'}</h1>
					<div className={'space-y-6 text-neutral-600 text-base sm:text-lg'}>
						<p>
							{'Have you ever found yourself thinking “Wow! Yearn’s yield generating vaults are a work of DeFi art. I WISH I could integrate them into what we’re building.” Well friend, you’ve come to the right place.'}
						</p>
						<p>
							{'Yearn’s Partnership Program lets developers easily integrate yield-generation into their products and earn 50% profit share from their contributed TVL. As the kids say… “LFG!”.'}
						</p>
						<p>
							{'We firmly believe that the value a protocol brings to the community and ecosystem is far more than just funds parked in a vault. So we work closely with our partners to integrate and form a mutually beneficial relationship, adding value to both protocols. If you’d like to team up, we’d love to hear from you! Simply reach out using the form below.'}
						</p>
					</div>
				</div>

				<div className={'rounded-2xl bg-neutral-0 p-6 shadow-sm'}>
					<div className={'flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between'}>
						<div>
							<p className={'text-lg font-semibold text-neutral-700'}>{'Partnership contact form'}</p>
							<p className={'text-neutral-500'}>{'Share a few details and we will follow up shortly.'}</p>
						</div>
						{response ? (
							<div
								className={`${response.isError ? 'bg-red-200 text-red-900' : 'bg-primary-100 text-neutral-900'} rounded-md px-4 py-3 text-sm font-medium`}>
								{response.message}
							</div>
						) : null}
					</div>

					<form
						ref={formRef}
						className={'grid grid-cols-1 gap-6 md:grid-cols-2'}
						onSubmit={handleSubmit}>
						<div className={'space-y-2'}>
							<label className={'block text-sm font-medium text-neutral-700'} htmlFor={'name'}>{'Your name*'}</label>
							<input
								autoComplete={'name'}
								className={'w-full rounded-lg border border-neutral-300 bg-neutral-0 p-3 text-neutral-900 shadow-sm outline-none transition focus:border-primary-600'}
								id={'name'}
								name={'name'}
								required
								type={'text'} />
						</div>
						<div className={'space-y-2'}>
							<label className={'block text-sm font-medium text-neutral-700'} htmlFor={'tguser'}>{'Telegram username*'}</label>
							<input
								autoComplete={'username'}
								className={'w-full rounded-lg border border-neutral-300 bg-neutral-0 p-3 text-neutral-900 shadow-sm outline-none transition focus:border-primary-600'}
								id={'tguser'}
								name={'tguser'}
								required
								type={'text'} />
						</div>
						<div className={'space-y-2'}>
							<label className={'block text-sm font-medium text-neutral-700'} htmlFor={'protocol'}>{'Protocol name*'}</label>
							<input
								className={'w-full rounded-lg border border-neutral-300 bg-neutral-0 p-3 text-neutral-900 shadow-sm outline-none transition focus:border-primary-600'}
								id={'protocol'}
								name={'protocol'}
								required
								type={'text'} />
						</div>
						<div className={'space-y-2'}>
							<label className={'block text-sm font-medium text-neutral-700'} htmlFor={'website'}>{'Website URL'}</label>
							<input
								autoComplete={'url'}
								className={'w-full rounded-lg border border-neutral-300 bg-neutral-0 p-3 text-neutral-900 shadow-sm outline-none transition focus:border-primary-600'}
								id={'website'}
								name={'website'}
								type={'url'} />
						</div>
						<div className={'md:col-span-2'}>
							<label className={'block text-sm font-medium text-neutral-700'} htmlFor={'message'}>{'Short explanation of what you are looking for'}</label>
							<textarea
								className={'mt-2 w-full rounded-lg border border-neutral-300 bg-neutral-0 p-3 text-neutral-900 shadow-sm outline-none transition focus:border-primary-600'}
								id={'message'}
								name={'message'}
								rows={4} />
						</div>
						<div className={'md:col-span-2'}>
							<button
								className={`flex w-full items-center justify-center rounded-lg border border-neutral-900 px-4 py-3 text-base font-medium transition ${
									isDisabled
										? 'cursor-not-allowed bg-neutral-300 text-neutral-600'
										: 'bg-neutral-900 text-neutral-0 hover:bg-neutral-700'
								}`}
								disabled={isDisabled}
								type={'submit'}>
								{isBusy ? 'Sending...' : 'Send request'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default TeamUpPage;
