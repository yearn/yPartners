import	React, {createContext, useContext, useEffect, useRef, useState}	from	'react';
import LogoYearn from 'components/icons/LogoYearn';
import {LOGOS} from 'utils/b2b/Partners';

import type {Dispatch, MutableRefObject, ReactElement, SetStateAction} from 'react';

type TPartnerContext = {
	partner: string,
	logo?: MutableRefObject<ReactElement>,
	set_partner?: Dispatch<SetStateAction<string>>
}

const	Partner = createContext<TPartnerContext>({partner: ''});

export const PartnerContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	[partner, set_partner] = useState('');
	const	logo = useRef(<LogoYearn className={'text-900 h-full w-full opacity-0'}/>);

	useEffect((): void => {
		if(partner !== ''){
			logo.current = LOGOS[partner];
		}
	}, [partner]);

	return (
		<Partner.Provider
			value={{
				partner,
				set_partner,
				logo
			}}>
			{children}
		</Partner.Provider>
	);
};

export const usePartner = (): TPartnerContext => useContext(Partner);

export default usePartner;
