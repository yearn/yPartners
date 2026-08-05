import {ethers} from 'ethers';

export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

const MULTICALL3_INTERFACE = new ethers.utils.Interface([
	'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)'
]);

export type TMulticallCall = {
	target: string,
	allowFailure: boolean,
	callData: string
};

export type TMulticallResult = {
	success: boolean,
	returnData: string
};

/**
 * Execute several read-only contract calls in one RPC eth_call via Multicall3.
 * Multicall3 is deployed at the same address on the supported EVM chains.
 */
export async function aggregate3(
	provider: ethers.providers.Provider,
	calls: TMulticallCall[]
): Promise<TMulticallResult[]> {
	if (calls.length === 0) {
		return [];
	}

	const data = MULTICALL3_INTERFACE.encodeFunctionData('aggregate3', [calls]);
	const response = await provider.call({to: MULTICALL3_ADDRESS, data});
	const [results] = MULTICALL3_INTERFACE.decodeFunctionResult('aggregate3', response) as [TMulticallResult[]];

	return results.map(({success, returnData}): TMulticallResult => ({success, returnData}));
}
