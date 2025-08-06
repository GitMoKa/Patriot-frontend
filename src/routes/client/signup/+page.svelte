<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	onMount(() => {
		// Redirect to step 1 of the new signup flow
		goto('/client/signup/step1');
	});
</script>

<svelte:head>
	<title>Redirecting to Sign Up - Patriot Glass Factory</title>
</svelte:head>

<div class="redirect-page">
	<div class="loading-container">
		<div class="loading-spinner"></div>
		<p>Redirecting to sign up...</p>
	</div>
</div>

<style>
	.redirect-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.loading-container {
		text-align: center;
		color: white;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s ease-in-out infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-container p {
		font-size: 1.1rem;
		margin: 0;
	}
</style>