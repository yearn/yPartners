type JSONValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export async function baseFetcher<TReturn = JSONValue>(url: string): Promise<TReturn> {
	console.log('[baseFetcher] Fetching:', url);

	try {
		const response = await fetch(url);

		if (!response.ok) {
			const error = `Failed to fetch ${url}: ${response.status} ${response.statusText}`;
			console.error('[baseFetcher] Error:', error);
			throw new Error(error);
		}

		const data = await response.json() as Promise<TReturn>;
		console.log('[baseFetcher] Success:', url);
		return data;
	} catch (error) {
		console.error('[baseFetcher] Exception:', url, error);
		throw error;
	}
}
