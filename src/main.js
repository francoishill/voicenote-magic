import App from './App.svelte';

import builtTime from './builtTime.js'
console.debug('builtTime', builtTime);

const app = new App({
	target: document.body,
	props: {
		// name: 'world'
	}
});

export default app;