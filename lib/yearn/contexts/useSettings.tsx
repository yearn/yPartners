import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import type {ReactElement, ReactNode} from 'react';

type TSettings = {
	yDaemonBaseURI: string;
};

type TSettingsContext = {
	settings: TSettings;
	updateSettings: (partial: Partial<TSettings>) => void;
};

const defaultSettings: TSettings = {
	yDaemonBaseURI: process.env.NEXT_PUBLIC_YDAEMON_BASE_URI
		|| process.env.YDAEMON_BASE_URI
		|| 'https://ydaemon.yearn.fi'
};

const SettingsContext = createContext<TSettingsContext>({
	settings: defaultSettings,
	updateSettings: (): void => undefined
});

export function SettingsProvider({children}: {children: ReactNode}): ReactElement {
	const [settings, setSettings] = useState<TSettings>(defaultSettings);

	const updateSettings = useCallback((partial: Partial<TSettings>): void => {
		setSettings((prev): TSettings => ({...prev, ...partial}));
	}, []);

	const value = useMemo<TSettingsContext>(() => ({
		settings,
		updateSettings
	}), [settings, updateSettings]);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings(): TSettingsContext {
	return useContext(SettingsContext);
}
