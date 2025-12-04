import type {HTMLAttributes, ReactElement} from 'react';

function classNames(...classes: Array<string | false | null | undefined>): string {
	return classes.filter(Boolean).join(' ');
}

export function Card({className, ...rest}: HTMLAttributes<HTMLDivElement>): ReactElement {
	return (
		<div
			className={classNames(
				'yearn--card rounded-none border border-neutral-200 bg-neutral-0 p-6 shadow-sm',
				className
			)}
			{...rest}
		/>
	);
}

export default Card;
