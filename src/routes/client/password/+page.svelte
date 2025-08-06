<script>
	import { onMount } from 'svelte';
	
	let activeTab = 'change'; // 'change' or 'forgot'
	let isLoading = false;
	let errors = {};
	let successMessage = '';
	
	// Change password form data
	let changePasswordData = {
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	};
	
	// Forgot password form data
	let forgotPasswordData = {
		email: ''
	};
	
	// Reset password form data (shown after forgot password)
	let resetPasswordData = {
		token: '',
		newPassword: '',
		confirmPassword: ''
	};
	
	let showResetForm = false;
	
	function validateChangePassword() {
		const newErrors = {};
		
		if (!changePasswordData.currentPassword) {
			newErrors.currentPassword = 'Current password is required';
		}
		
		if (!changePasswordData.newPassword) {
			newErrors.newPassword = 'New password is required';
		} else if (changePasswordData.newPassword.length < 8) {
			newErrors.newPassword = 'Password must be at least 8 characters';
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(changePasswordData.newPassword)) {
			newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
		}
		
		if (!changePasswordData.confirmPassword) {
			newErrors.confirmPassword = 'Please confirm your password';
		} else if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}
		
		return newErrors;
	}
	
	async function handleChangePassword() {
		errors = {};
		successMessage = '';
		
		const validationErrors = validateChangePassword();
		if (Object.keys(validationErrors).length > 0) {
			errors = validationErrors;
			return;
		}
		
		isLoading = true;
		
		try {
			// Simulate API call to POST /users/update-password
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			successMessage = 'Password updated successfully!';
			changePasswordData = {
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			};
			
		} catch (error) {
			console.error('Failed to change password:', error);
			errors.submit = 'Failed to change password. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	async function handleForgotPassword() {
		errors = {};
		successMessage = '';
		
		if (!forgotPasswordData.email) {
			errors.email = 'Email is required';
			return;
		}
		
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordData.email)) {
			errors.email = 'Please enter a valid email address';
			return;
		}
		
		isLoading = true;
		
		try {
			// Simulate API call to POST /users/forgot-password
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			successMessage = 'Password reset instructions have been sent to your email.';
			showResetForm = true;
			
		} catch (error) {
			console.error('Failed to send reset email:', error);
			errors.submit = 'Failed to send reset email. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	async function handleResetPassword() {
		errors = {};
		successMessage = '';
		
		const newErrors = {};
		
		if (!resetPasswordData.token) {
			newErrors.token = 'Reset token is required';
		}
		
		if (!resetPasswordData.newPassword) {
			newErrors.newPassword = 'New password is required';
		} else if (resetPasswordData.newPassword.length < 8) {
			newErrors.newPassword = 'Password must be at least 8 characters';
		}
		
		if (!resetPasswordData.confirmPassword) {
			newErrors.confirmPassword = 'Please confirm your password';
		} else if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}
		
		if (Object.keys(newErrors).length > 0) {
			errors = newErrors;
			return;
		}
		
		isLoading = true;
		
		try {
			// Simulate API call to POST /users/reset-password
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			successMessage = 'Password reset successfully! You can now log in with your new password.';
			showResetForm = false;
			resetPasswordData = {
				token: '',
				newPassword: '',
				confirmPassword: ''
			};
			
		} catch (error) {
			console.error('Failed to reset password:', error);
			errors.submit = 'Failed to reset password. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	function switchTab(tab) {
		activeTab = tab;
		errors = {};
		successMessage = '';
		showResetForm = false;
	}
</script>

<svelte:head>
	<title>Password Management - Patriot</title>
</svelte:head>

<div class="password-page">
	<div class="header">
		<h1>Password Management</h1>
		<p>Change your password or reset it if you've forgotten it</p>
	</div>
	
	<div class="password-card">
		<div class="tabs">
			<button 
				class="tab" 
				class:active={activeTab === 'change'}
				on:click={() => switchTab('change')}
			>
				Change Password
			</button>
			<button 
				class="tab" 
				class:active={activeTab === 'forgot'}
				on:click={() => switchTab('forgot')}
			>
				Forgot Password
			</button>
		</div>
		
		<div class="tab-content">
			{#if successMessage}
				<div class="success-banner">{successMessage}</div>
			{/if}
			
			{#if errors.submit}
				<div class="error-banner">{errors.submit}</div>
			{/if}
			
			{#if activeTab === 'change'}
				<form on:submit|preventDefault={handleChangePassword} class="password-form">
					<h2>Change Password</h2>
					<p class="form-description">Enter your current password and choose a new one.</p>
					
					<div class="form-group">
						<label for="currentPassword">Current Password</label>
						<input
							type="password"
							id="currentPassword"
							bind:value={changePasswordData.currentPassword}
							class:error={errors.currentPassword}
							disabled={isLoading}
						/>
						{#if errors.currentPassword}
							<span class="error-message">{errors.currentPassword}</span>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="newPassword">New Password</label>
						<input
							type="password"
							id="newPassword"
							bind:value={changePasswordData.newPassword}
							class:error={errors.newPassword}
							disabled={isLoading}
						/>
						{#if errors.newPassword}
							<span class="error-message">{errors.newPassword}</span>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="confirmPassword">Confirm New Password</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={changePasswordData.confirmPassword}
							class:error={errors.confirmPassword}
							disabled={isLoading}
						/>
						{#if errors.confirmPassword}
							<span class="error-message">{errors.confirmPassword}</span>
						{/if}
					</div>
					
					<button type="submit" class="btn btn-primary" disabled={isLoading}>
						{#if isLoading}
							<span class="spinner"></span>
							Changing Password...
						{:else}
							Change Password
						{/if}
					</button>
				</form>
			{:else}
				{#if !showResetForm}
					<form on:submit|preventDefault={handleForgotPassword} class="password-form">
						<h2>Forgot Password</h2>
						<p class="form-description">Enter your email address and we'll send you instructions to reset your password.</p>
						
						<div class="form-group">
							<label for="email">Email Address</label>
							<input
								type="email"
								id="email"
								bind:value={forgotPasswordData.email}
								class:error={errors.email}
								disabled={isLoading}
								placeholder="Enter your email address"
							/>
							{#if errors.email}
								<span class="error-message">{errors.email}</span>
							{/if}
						</div>
						
						<button type="submit" class="btn btn-primary" disabled={isLoading}>
							{#if isLoading}
								<span class="spinner"></span>
								Sending Instructions...
							{:else}
								Send Reset Instructions
							{/if}
						</button>
					</form>
				{:else}
					<form on:submit|preventDefault={handleResetPassword} class="password-form">
						<h2>Reset Password</h2>
						<p class="form-description">Enter the reset token from your email and choose a new password.</p>
						
						<div class="form-group">
							<label for="token">Reset Token</label>
							<input
								type="text"
								id="token"
								bind:value={resetPasswordData.token}
								class:error={errors.token}
								disabled={isLoading}
								placeholder="Enter the token from your email"
							/>
							{#if errors.token}
								<span class="error-message">{errors.token}</span>
							{/if}
						</div>
						
						<div class="form-group">
							<label for="resetNewPassword">New Password</label>
							<input
								type="password"
								id="resetNewPassword"
								bind:value={resetPasswordData.newPassword}
								class:error={errors.newPassword}
								disabled={isLoading}
							/>
							{#if errors.newPassword}
								<span class="error-message">{errors.newPassword}</span>
							{/if}
						</div>
						
						<div class="form-group">
							<label for="resetConfirmPassword">Confirm New Password</label>
							<input
								type="password"
								id="resetConfirmPassword"
								bind:value={resetPasswordData.confirmPassword}
								class:error={errors.confirmPassword}
								disabled={isLoading}
							/>
							{#if errors.confirmPassword}
								<span class="error-message">{errors.confirmPassword}</span>
							{/if}
						</div>
						
						<button type="submit" class="btn btn-primary" disabled={isLoading}>
							{#if isLoading}
								<span class="spinner"></span>
								Resetting Password...
							{:else}
								Reset Password
							{/if}
						</button>
					</form>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.password-page {
		max-width: 600px;
		margin: 0 auto;
	}
	
	.header {
		margin-bottom: 32px;
	}
	
	.header h1 {
		margin: 0 0 8px 0;
		font-size: 32px;
		font-weight: 700;
		color: #1e293b;
	}
	
	.header p {
		margin: 0;
		color: #64748b;
		font-size: 16px;
	}
	
	.password-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}
	
	.tabs {
		display: flex;
		border-bottom: 1px solid #e2e8f0;
	}
	
	.tab {
		flex: 1;
		padding: 16px 24px;
		background: none;
		border: none;
		font-size: 16px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.tab:hover {
		background: #f8fafc;
	}
	
	.tab.active {
		color: #3b82f6;
		border-bottom: 2px solid #3b82f6;
		background: #f8fafc;
	}
	
	.tab-content {
		padding: 32px;
	}
	
	.success-banner {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 24px;
	}
	
	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 24px;
	}
	
	.password-form h2 {
		margin: 0 0 8px 0;
		font-size: 24px;
		font-weight: 600;
		color: #1e293b;
	}
	
	.form-description {
		margin: 0 0 24px 0;
		color: #64748b;
		font-size: 14px;
	}
	
	.form-group {
		margin-bottom: 20px;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #374151;
		font-size: 14px;
	}
	
	.form-group input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 16px;
		transition: border-color 0.2s ease;
	}
	
	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-group input.error {
		border-color: #dc2626;
	}
	
	.error-message {
		display: block;
		margin-top: 4px;
		color: #dc2626;
		font-size: 14px;
	}
	
	.btn {
		width: 100%;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		font-size: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	
	.btn-primary {
		background: #3b82f6;
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}
	
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>

