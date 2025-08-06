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

<div class="auth-page">
	<div class="auth-background">
		<div class="auth-overlay"></div>
	</div>
	
	<div class="auth-container">
		<div class="auth-card">
			<div class="loading-container" style="text-align: center; color: var(--text-primary);">
				<div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
				<p style="font-size: 1.1rem; margin: 0;">Redirecting to sign up...</p>
			</div>
		</div>
	</div>
</div>