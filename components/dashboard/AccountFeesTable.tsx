import {useMemo, useState} from 'react';

import type {ReactElement} from 'react';

type TAccountFees = {
	address: string;
	totalFees: string;
	totalFeesNormalized: number;
	currentShares: string;
	currentSharesNormalized: number;
};

type TProps = {
	accountFees: TAccountFees[];
};

type TSortColumn = 'address' | 'currentSharesNormalized' | 'totalFeesNormalized';
type TSortDirection = 'asc' | 'desc';

function AccountFeesTable({accountFees}: TProps): ReactElement {
	const [sortColumn, setSortColumn] = useState<TSortColumn>('currentSharesNormalized');
	const [sortDirection, setSortDirection] = useState<TSortDirection>('desc');

	const sortedAccounts = useMemo(() => {
		const sorted = [...accountFees].sort((a, b) => {
			let compareA: string | number;
			let compareB: string | number;

			if (sortColumn === 'address') {
				compareA = a.address.toLowerCase();
				compareB = b.address.toLowerCase();
			} else {
				compareA = a[sortColumn];
				compareB = b[sortColumn];
			}

			if (compareA < compareB) {
				return sortDirection === 'asc' ? -1 : 1;
			}
			if (compareA > compareB) {
				return sortDirection === 'asc' ? 1 : -1;
			}
			return 0;
		});

		return sorted;
	}, [accountFees, sortColumn, sortDirection]);

	const handleSort = (column: TSortColumn): void => {
		if (sortColumn === column) {
			// Toggle direction if clicking the same column
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			// Set new column with default direction
			setSortColumn(column);
			setSortDirection(column === 'address' ? 'asc' : 'desc');
		}
	};

	const SortIcon = ({column}: {column: TSortColumn}): ReactElement => {
		if (sortColumn !== column) {
			return (
				<span className={'ml-1 text-neutral-400'}>
					{'↕'}
				</span>
			);
		}
		return (
			<span className={'ml-1'}>
				{sortDirection === 'asc' ? '↑' : '↓'}
			</span>
		);
	};

	if (accountFees.length === 0) {
		return (
			<div className={'flex h-48 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50'}>
				<p className={'text-neutral-500'}>{'No account data available'}</p>
			</div>
		);
	}

	return (
		<div className={'w-full'}>
			<h3 className={'mb-4 text-xl font-semibold text-neutral-900'}>
				{'Account Fees Breakdown'}
			</h3>
			<div className={'overflow-x-auto rounded-lg border border-neutral-200'}>
				<table className={'min-w-full divide-y divide-neutral-200'}>
					<thead className={'bg-neutral-50'}>
						<tr>
							<th
								scope={'col'}
								onClick={() => handleSort('address')}
								className={'cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-700 hover:bg-neutral-100'}>
								<div className={'flex items-center'}>
									{'Address'}
									<SortIcon column={'address'} />
								</div>
							</th>
							<th
								scope={'col'}
								onClick={() => handleSort('currentSharesNormalized')}
								className={'cursor-pointer px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 hover:bg-neutral-100'}>
								<div className={'flex items-center justify-end'}>
									{'Current Shares'}
									<SortIcon column={'currentSharesNormalized'} />
								</div>
							</th>
							<th
								scope={'col'}
								onClick={() => handleSort('totalFeesNormalized')}
								className={'cursor-pointer px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-700 hover:bg-neutral-100'}>
								<div className={'flex items-center justify-end'}>
									{'Total Fees (USDC)'}
									<SortIcon column={'totalFeesNormalized'} />
								</div>
							</th>
						</tr>
					</thead>
					<tbody className={'divide-y divide-neutral-200 bg-white'}>
						{sortedAccounts.map((account, idx): ReactElement => (
							<tr
								key={account.address}
								className={idx % 2 === 0 ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50 hover:bg-neutral-100'}>
								<td className={'whitespace-nowrap px-6 py-4 text-sm font-mono text-neutral-900'}>
									{account.address}
								</td>
								<td className={'whitespace-nowrap px-6 py-4 text-right text-sm text-neutral-900'}>
									{account.currentSharesNormalized.toFixed(2)}
								</td>
								<td className={'whitespace-nowrap px-6 py-4 text-right text-sm text-neutral-900'}>
									{`$${account.totalFeesNormalized.toFixed(2)}`}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default AccountFeesTable;
