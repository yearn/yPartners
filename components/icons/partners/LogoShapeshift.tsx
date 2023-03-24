import 	Image	from	'next/image';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & {isColored?: boolean};

function	LogoShapeshift(props: TLogo): ReactElement {

	return props.isColored ? (
		<Image
			width={500}
			height={500}
			alt={'shapeshiftdao logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/shapeshiftdao/logo.svg'}/>
	):(
		<Image
			width={40}
			height={43}
			alt={'shapeshiftdao logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/shapeshiftdao/monochrome.svg'}/>
	);
}

export default LogoShapeshift;
