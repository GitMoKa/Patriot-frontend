import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create theme store
function createThemeStore() {
	// Get initial theme from localStorage or default to light
	const getInitialTheme = () => {
		if (browser) {
			const stored = localStorage.getItem('theme');
			if (stored) return stored;
			
			// Check system preference
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				return 'dark';
			}
		}
		return 'light';
	};

	const { subscribe, set, update } = writable(getInitialTheme());

	return {
		subscribe,
		
		// Toggle between light and dark
		toggle: () => {
			update(theme => {
				const newTheme = theme === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', newTheme);
					document.documentElement.setAttribute('data-theme', newTheme);
				}
				return newTheme;
			});
		},

		// Set specific theme
		setTheme: (theme) => {
			set(theme);
			if (browser) {
				localStorage.setItem('theme', theme);
				document.documentElement.setAttribute('data-theme', theme);
			}
		},

		// Initialize theme
		init: () => {
			if (browser) {
				const theme = getInitialTheme();
				document.documentElement.setAttribute('data-theme', theme);
				set(theme);
			}
		}
	};
}

export const themeStore = createThemeStore();

