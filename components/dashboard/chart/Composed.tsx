import	React, {ReactElement}		from	'react';
import {ResponsiveContainer} from 'recharts';


function	Composed(): ReactElement {
	return (
		<ResponsiveContainer width={'85%'} height={'100%'}>
			<h1>{'Composed Chart'}</h1>
		</ResponsiveContainer>
	);
}

export default Composed;