<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.js';

	let isAuthenticated = false;

	// Subscribe to auth store
	authStore.subscribe(state => {
		isAuthenticated = state.isAuthenticated;
	});

	onMount(async () => {
		// Initialize auth store to check current authentication status
		await authStore.init();
		
		// Redirect based on authentication status and role
		if (isAuthenticated) {
			// Get user data to check role
			const currentUser = $authStore.user;
			if (currentUser?.role === 'driver') {
				goto('/driver');
			} else {
				goto('/dashboard');
			}
		} else {
			goto('/about');
		}
	});
</script>

<!-- This page redirects based on authentication status -->