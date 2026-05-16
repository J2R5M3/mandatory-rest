import { scheduled } from './cron';
// Import the output Astro worker directly
import handler from '../dist/_worker.js/index.js';

export default {
	fetch: handler.fetch,
	scheduled,
};
