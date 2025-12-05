import {RainbowKitProvider, getDefaultConfig} from '@rainbow-me/rainbowkit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SWRConfig} from 'swr';
import type {ReactElement, ReactNode} from 'react';
import {WagmiProvider} from 'wagmi';
import {arbitrum, base, mainnet, optimism, polygon} from 'wagmi/chains';
import {SettingsProvider} from './useSettings';

const queryClient = new QueryClient();
const supportedChains = [mainnet, arbitrum, optimism, polygon, base] as const;
const walletProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
	|| process.env.WALLETCONNECT_PROJECT_ID
	|| '00000000000000000000000000000000';

const wagmiConfig = getDefaultConfig({
	appName: process.env.WEBSITE_NAME || 'Yearn Partners',
	projectId: walletProjectId,
	ssr: true,
	chains: supportedChains
});

type TWithYearnProps = {
	children: ReactNode;
};

export function WithYearn({children}: TWithYearnProps): ReactElement {
	return (
		<SettingsProvider>
			<WagmiProvider config={wagmiConfig}>
				<QueryClientProvider client={queryClient}>
					<SWRConfig value={{revalidateOnFocus: false}}>
						<RainbowKitProvider modalSize={'compact'}>{children}</RainbowKitProvider>
					</SWRConfig>
				</QueryClientProvider>
			</WagmiProvider>
		</SettingsProvider>
	);
}

export default WithYearn;
