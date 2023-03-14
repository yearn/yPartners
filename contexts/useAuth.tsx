import React, {createContext, memo, useContext, useState} from 'react';

import type {ReactElement} from 'react';

export type	TAuthContext = {
	isLoggedIn: boolean,
	isLoading: boolean,
	hasModal: boolean,
	set_isLoggedIn: (isLoggedIn: boolean) => void,
	set_isLoading: (isLoading: boolean) => void,
	set_hasModal: (hasModal: boolean) => void,
}

const	defaultProps: TAuthContext = {
	isLoggedIn: false,
	isLoading: false,
	hasModal: false,
	set_isLoggedIn: (): void => undefined,
	set_isLoading: (): void => undefined,
	set_hasModal: (): void => undefined
};

const	AuthContext = createContext<TAuthContext>(defaultProps);
export const AuthContextApp = memo(function AuthContextApp({children}: {children: ReactElement}): ReactElement {

	const	[isLoggedIn, set_isLoggedIn] = useState(false);
	const	[isLoading, set_isLoading] = useState(false);
	const	[hasModal, set_hasModal] = useState(false);

	return (
		<AuthContext.Provider
			value={{
				isLoggedIn: isLoggedIn,
				isLoading: isLoading,
				hasModal: hasModal,
				set_isLoggedIn: set_isLoggedIn,
				set_isLoading: set_isLoading,
				set_hasModal: set_hasModal
			}}>
			{children}
		</AuthContext.Provider>
	);
});

export const useAuth = (): TAuthContext => useContext(AuthContext);
export default useAuth;
