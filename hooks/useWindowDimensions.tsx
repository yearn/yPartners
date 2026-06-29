// https://stackoverflow.com/questions/36862334/get-viewport-window-height-in-reactjs

import {useEffect, useState} from 'react';

type TWindowDimensions = {
	width: number,
	height: number
}

type TVoidCleanupFunction = () => void;

function getWindowDimensions(): TWindowDimensions {
	const {innerWidth: width, innerHeight: height} = window;
	return {
		width,
		height
	};
}

export default function useWindowDimensions(): TWindowDimensions {
	const [windowDimensions, set_windowDimensions] = useState({width: 0, height: 0});

	useEffect((): TVoidCleanupFunction => {
		// Read window size after mount to stay SSR-safe (window is undefined on the server).
		// eslint-disable-next-line react-hooks/set-state-in-effect
		set_windowDimensions(getWindowDimensions());

		function handleResize(): void {
			set_windowDimensions(getWindowDimensions());
		}

		window.addEventListener('resize', handleResize);

		return (): void => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return windowDimensions;
}
