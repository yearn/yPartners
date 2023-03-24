import 	Image	from	'next/image';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & {isColored?: boolean};

function	LogoInverse(props: TLogo): ReactElement {

	return props.isColored ? (
		<Image
			width={500}
			height={500}
			alt={'inverse logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/inverse/logo.svg'}/>
	):(
		<Image
			width={42}
			height={34}
			alt={'inverse logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/inverse/monochrome.svg'}/>
	);
}

export default LogoInverse;



