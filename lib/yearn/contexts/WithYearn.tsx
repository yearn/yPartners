import {SWRConfig} from 'swr';
import type {ReactElement, ReactNode} from 'react';
import {SettingsProvider} from './useSettings';

type TWithYearnProps = {
	children: ReactNode;
};

export function WithYearn({children}: TWithYearnProps): ReactElement {
	return (
		<SettingsProvider>
			<SWRConfig value={{revalidateOnFocus: false}}>
				{children}
			</SWRConfig>
		</SettingsProvider>
	);
}

export default WithYearn;
