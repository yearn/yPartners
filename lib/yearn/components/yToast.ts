type ToastOptions = {
	type?: 'success' | 'info' | 'warning' | 'error';
	content: string;
	duration?: number;
};

type ToastController = {
	toast: (options: ToastOptions) => void;
};

export function yToast(): ToastController {
	const toast = ({type, content}: ToastOptions): void => {
		const prefix = type ? `${type.toUpperCase()}: ` : '';

		if (typeof window !== 'undefined') {
			window.alert(`${prefix}${content}`);
		} else {
			console.log(`${prefix}${content}`);
		}
	};

	return {toast};
}

export default yToast;
