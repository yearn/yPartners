import React, {ReactElement} from 'react';
import Document, {DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript} from 'next/document';

class MyDocument extends Document {
	static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
		const initialProps: DocumentInitialProps = await Document.getInitialProps(ctx);
		return {...initialProps};
	}

	render(): ReactElement {
		return (
			<Html lang={'en'}>
				<Head>
					<link href={'/fonts/fonts.css'} rel={'stylesheet'} />
				</Head>
				<body className={'bg-neutral-100 transition-colors duration-150'} data-theme={'light'}>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;