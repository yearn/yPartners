import 	Image	from	'next/image';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & {isColored?: boolean};

function	LogoPickle(props: TLogo): ReactElement {

	return props.isColored ?(
		<Image
			width={500}
			height={500}
			alt={'pickle logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/pickle/logo.svg'}/>
	):(
		<Image
			width={30}
			height={40}
			alt={'pickle logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/pickle/monochrome.svg'}/>
	);
}

export default LogoPickle;



