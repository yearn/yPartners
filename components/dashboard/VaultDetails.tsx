import	React, {ReactElement}		from	'react';


function	VaultDetails(): ReactElement {
	return (
		<div className={'flex justify-between my-20 w-[80%] bg-good-ol-grey-100'}>
			<div>
				<p>{'TVL'}</p>
				<h1>{'$ 987, 125, 743. 68'}</h1>
			</div>

			<div>
				<p>{'Fees earned to date'}</p>
				<h1>{'$ 654, 125, 743. 68'}</h1>
			</div>

			<div>
				<p>{'Annual Yield'}</p>
				<h1>{'6 %'}</h1>
			</div>

			<div>
				<p>{'Risk Score'}</p>
				<h1>{'4'}</h1>
			</div>
		</div>
	);
}

export default VaultDetails;