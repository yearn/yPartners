import {forwardRef} from 'react';

import type {ButtonHTMLAttributes} from 'react';

type ButtonVariant = 'filled' | 'outlined' | 'plain';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
};

function classNames(...classes: Array<string | false | null | undefined>): string {
	return classes.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{variant = 'filled', className, type = 'button', ...rest},
	ref
) {
	const variantClassName = {
		filled: 'bg-neutral-900 text-neutral-0 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400',
		outlined: 'border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-neutral-0 disabled:border-neutral-300',
		plain: 'bg-transparent text-neutral-900 hover:text-neutral-600'
	}[variant];

	return (
		<button
			ref={ref}
			type={type}
			data-variant={variant}
			className={classNames(
				'yearn--button inline-flex items-center justify-center px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed',
				variantClassName,
				className
			)}
			{...rest} />
	);
});

export default Button;
