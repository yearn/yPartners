import {useCallback, useEffect} from 'react';
import {createPortal} from 'react-dom';

import IconCross from '../icons/IconCross';

import type {ReactElement, ReactNode} from 'react';

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
};

function classNames(...classes: Array<string | false | null | undefined>): string {
	return classes.filter(Boolean).join(' ');
}

export function Modal({isOpen, onClose, title, children}: ModalProps): ReactElement | null {
	const handleKeyDown = useCallback((event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			onClose();
		}
	}, [onClose]);

	useEffect((): (() => void) | void => {
		if (!isOpen) {
			return;
		}

		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', handleKeyDown);

		return (): void => {
			document.body.style.overflow = '';
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown, isOpen]);

	if (!isOpen || typeof window === 'undefined') {
		return null;
	}

	return createPortal(
		<div
			role={'dialog'}
			aria-modal={'true'}
			className={'yearn--modal fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4'}
			onClick={onClose}>
			<div
				className={'relative w-full max-w-2xl bg-neutral-0 p-6'}
				onClick={(event): void => {
					event.stopPropagation();
				}}>
				{title ? (
					<div className={'mb-4 flex items-center justify-between'}>
						<h2 className={'text-lg font-semibold'}>{title}</h2>
						<button
							type={'button'}
							aria-label={'Close'}
							className={classNames('text-neutral-600 transition-colors hover:text-neutral-900')}
							onClick={onClose}>
							<IconCross className={'h-5 w-5'} />
						</button>
					</div>
				) : null}
				{children}
			</div>
		</div>,
		document.body
	);
}

export default Modal;
