import {SWRConfig} from 'swr';
import type {ReactElement, ReactNode} from 'react';

type TWithYearnProps = {
	children: ReactNode;
};

export function WithYearn({children}: TWithYearnProps): ReactElement {
	return (
		<SWRConfig value={{revalidateOnFocus: false}}>
			{children}
		</SWRConfig>
	);
}

export default WithYearn;
