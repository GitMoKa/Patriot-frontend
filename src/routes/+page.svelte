<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to the client home page
		goto('/client');
	});
</script>

<!-- This page redirects to /client -->