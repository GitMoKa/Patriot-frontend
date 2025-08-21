import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 3000,
		proxy: {
			'/v1': {
				target: 'https://patriot-backend-api-e8be76603d85.herokuapp.com',
				changeOrigin: true,
			},
		}
	}
});

