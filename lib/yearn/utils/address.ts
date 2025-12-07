import {constants, utils} from 'ethers';

export type TAddress = `0x${string}`;

export const ZERO_ADDRESS = constants.AddressZero as TAddress;

export function toAddress(value: string | undefined | null): TAddress {
	if (!value) {
		return ZERO_ADDRESS;
	}

	try {
		return utils.getAddress(value) as TAddress;
	} catch {
		return ZERO_ADDRESS;
	}
}

export function isZeroAddress(value: string | undefined | null): boolean {
	try {
		return utils.getAddress(value ?? ZERO_ADDRESS) === ZERO_ADDRESS;
	} catch {
		return true;
	}
}

export function truncateHex(value: string, chars = 4): string {
	const address = toAddress(value);
	return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
