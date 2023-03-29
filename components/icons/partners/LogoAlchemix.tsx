import 	Image	from	'next/image';

import type {ReactElement, SVGProps} from 'react';

type TLogo = SVGProps<SVGSVGElement> & {isColored?: boolean};

function	LogoAlchemix(props: TLogo): ReactElement {

	return props.isColored ? (
		<div
			style={{
				display:'flex',
				alignItems:'center',
				justifyContent:'center',
				backgroundColor: '#181E28',
				borderRadius:'50%',
				width:'250px',
				height:'250px'
			}}>
			<Image
				width={200}
				height={200}
				alt={'alchemix logo'}
				src={'https://raw.githubusercontent.com/yearn/yearn-assets/d37bb4f2dd42f337e9ddf8dcbbb608cc0f2cdd5f/icons/protocols/alchemix/logo.svg'}
			/>
		</div>
	) : (	
		<Image
			width={40}
			height={40}
			alt={'alchemix logo'}
			src={'https://raw.githubusercontent.com/yearn/yearn-assets/361525137e5f1af3fd78ae9c6cc92f79733a6b9a/icons/protocols/alchemix/monochrome.svg'}
		/>
	);
}

export default LogoAlchemix;



