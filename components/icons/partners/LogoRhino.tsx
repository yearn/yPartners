import 	Image	from	'next/image';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & { isColored?: boolean };

function LogoRhino(props: TLogo): ReactElement {

	return props.isColored ? (
		<Image
			width={500}
			height={500}
			alt={'rhino.fi logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/rhino.fi/logo.svg'}/>
	):(
		<Image
			style={{
				paddingTop:'4.5px'
			}}
			width={70}
			height={35}
			alt={'rhino.fi logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/rhino.fi/monochrome.svg'}/>
	);
}

export default LogoRhino;
