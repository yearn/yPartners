import type {NextApiRequest, NextApiResponse} from 'next';

const getClientIP = (headerValue?: string | string[]): string => {
	if (!headerValue) {
		return '';
	}

	const header = Array.isArray(headerValue) ? headerValue[0] : headerValue;
	return header.split(',')[0]?.trim();
};

const isBlocked = (ip: string, blockedList: string[]): boolean => {
	return Boolean(ip) && blockedList.includes(ip);
};

export default async function handler(request: NextApiRequest, response: NextApiResponse): Promise<void> {
	if (request.method !== 'POST') {
		response.setHeader('Allow', 'POST');
		return response.status(405).json({success: false});
	}

	const ipToBlock = (process.env.IP_TO_BLOCK || '').split(',').map((ip): string => ip.trim()).filter(Boolean);
	const clientIP = getClientIP(request.headers['x-forwarded-for']);

	if (isBlocked(clientIP, ipToBlock)) {
		return response.status(403).json({success: false});
	}

	const userAgent = request.headers['user-agent'] || '';
	if (typeof userAgent === 'string' && userAgent.includes('python-requests')) {
		return response.status(403).json({success: false});
	}

	const {name, tguser, protocol, website, message} = request.body || {};
	if (!name || !tguser || !protocol) {
		return response.status(400).json({success: false, error: 'Missing required fields'});
	}

	const botToken = process.env.TELEGRAM_BOT;
	const userID = process.env.TELEGRAM_RECIPIENT_USERID;

	if (!botToken || !userID) {
		return response.status(500).json({success: false, error: 'Missing Telegram configuration'});
	}

	const textMessage = `
-------------------------------------------------------------------
You got a new message from your website contact form:
Name: ${name}
Telegram username: ${tguser}
Protocol: ${protocol}
Website: ${website || 'Not provided'}
Additional information: ${message || 'Not provided'}
------------------------------------------------------------------`;

	try {
		const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				chat_id: userID,
				text: textMessage
			})
		});

		if (!telegramResponse.ok) {
			const errorBody = await telegramResponse.json().catch(() => null);
			const errorMessage = errorBody?.description || `Telegram responded with status ${telegramResponse.status}`;
			return response.status(500).json({success: false, error: errorMessage});
		}

		return response.status(200).json({success: true});
	} catch (error) {
		console.error('Telegram error:', error);
		const messageError = error instanceof Error ? error.message : 'Unknown error';
		return response.status(500).json({success: false, error: messageError});
	}
}
