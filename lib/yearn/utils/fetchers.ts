type JSONValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export async function baseFetcher<TReturn = JSONValue>(url: string): Promise<TReturn> {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}

	return response.json() as Promise<TReturn>;
}
