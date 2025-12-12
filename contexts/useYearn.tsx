import {createContext, memo, useContext, useMemo} from 'react';
import {toAddress} from 'lib/yearn/utils/address';

import type {ReactElement} from 'react';
import type {TYearnVault} from 'types/types';
import type {TDict, VoidPromiseFunction} from 'lib/yearn/utils/types';

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
	const vaults: TYearnVault[] = [];
	const isLoadingVaultList = false;
	const mutateVaultList = async (): Promise<void> => Promise.resolve();

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
