import {createContext, memo, useContext, useMemo} from 'react';
import useSWR from 'swr';
import {useSettings} from '@yearn-finance/web-lib/contexts/useSettings';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {baseFetcher} from '@yearn-finance/web-lib/utils/fetchers';

import type {ReactElement} from 'react';
import type {SWRResponse} from 'swr';
import type {TYearnVault} from 'types/types';
import type {TDict, VoidPromiseFunction} from '@yearn-finance/web-lib/utils/types';

export type	TYearnContext = {
	vaults: TDict<TYearnVault>,
	isLoadingVaultList: boolean,
	mutateVaultList: VoidPromiseFunction
}
const	defaultProps: TYearnContext = {
	vaults: {},
	isLoadingVaultList: false,
	mutateVaultList: async (): Promise<void> => Promise.resolve()
};

const	YearnContext = createContext<TYearnContext>(defaultProps);
export const YearnContextApp = memo(function YearnContextApp({children}: {children: ReactElement}): ReactElement {
	const {settings: baseAPISettings} = useSettings();

	const	{data: vaults, isLoading: isLoadingVaultList, mutate: mutateVaultList} = useSWR(
		`${baseAPISettings.yDaemonBaseURI}/vaults/all?strategiesDetails=withDetails`,
		baseFetcher,
		{revalidateOnFocus: false}
	) as SWRResponse;


	const	vaultsObject = useMemo((): TDict<TYearnVault> => {
		const	_vaultsObject = (vaults || []).reduce((acc: TDict<TYearnVault>, vault: TYearnVault): TDict<TYearnVault> => {
			acc[toAddress(vault.address)] = vault;
			return acc;
		}, {});
		return _vaultsObject;
	}, [vaults]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	const	contextValue = useMemo((): TYearnContext => ({
		vaults: vaultsObject,
		isLoadingVaultList,
		mutateVaultList
	}), [vaultsObject, isLoadingVaultList, mutateVaultList]);

	return (
		<YearnContext.Provider value={contextValue}>
			{children}
		</YearnContext.Provider>
	);
});

export const useYearn = (): TYearnContext => useContext(YearnContext);
export default useYearn;
