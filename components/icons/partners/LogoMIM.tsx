import 	Image	from	'next/image';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & {isColored?: boolean};

function	LogoMIM(props: TLogo): ReactElement {

	return props.isColored ? (
		<Image
			width={250}
			height={250}
			alt={'abracadabra logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/361525137e5f1af3fd78ae9c6cc92f79733a6b9a/icons/protocols/abracadabra/logo.svg'}/>
	):(
		<Image
			width={40}
			height={40}
			alt={'abracadabra logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/361525137e5f1af3fd78ae9c6cc92f79733a6b9a/icons/protocols/abracadabra/monochrome.svg'}/>
	);
}

export default LogoMIM;



