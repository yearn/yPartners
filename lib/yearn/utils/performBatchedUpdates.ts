import {unstable_batchedUpdates} from 'react-dom';

export default function performBatchedUpdates(callback: () => void): void {
	unstable_batchedUpdates(callback);
}
