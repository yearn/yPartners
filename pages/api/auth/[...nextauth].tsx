import	NextAuth	from	'next-auth';
import	CredentialsProvider			from	'next-auth/providers/credentials';
import	{ethers}					from	'ethers';

import type {NextAuthOptions} from 'next-auth';

export const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/',
		signOut: '/',
		error: '/'
	},
	providers: [
		CredentialsProvider({
			id: 'web3',
			name: 'Web3',
			credentials: {
				address: {
					label: 'Address',
					type: 'text',
					placeholder: '0x0'
				},
				signature: {
					label: 'Signature',
					type: 'text',
					placeholder: '0x0'
				}
			},
			async authorize(credentials): Promise<any> {
				try {
					const	signer = ethers.utils.verifyMessage('YOU CAN\'T BUILD TRUSTLESS SYSTEMS WITHOUT TRUST.', credentials?.signature || '');
					if (signer !== credentials?.address) {
						return null;
					}
					return {
						id: credentials?.address,
						name: credentials?.address,
						email: credentials?.address,
						image: credentials?.address
					};

					
				} catch (e) {
					return null;
				}
			}
		})
	],
	callbacks: {
		async jwt({token}): Promise<any> {
			token.userRole = 'admin';
			return token;
		}
	}
};

export default NextAuth(authOptions);