<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let orderId = '';
	let order = null;
	let orderItems = [];
	let isLoading = false;
	let isEditing = false;
	let showVerifyCode = false;
	let errors = {};
	let successMessage = '';
	
	let editData = {
		status: '',
		shippingAddress: ''
	};
	
	let verifyCodeData = {
		code: ''
	};
	
	// Simulate API call to get order details
	async function loadOrder() {
		isLoading = true;
		try {
			// Simulate API call to GET /orders/:id
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Mock data
			order = {
				id: orderId,
				orderNumber: `ORD-${orderId.padStart(3, '0')}`,
				status: 'pending',
				totalAmount: 299.99,
				customerName: 'John Doe',
				customerEmail: 'john.doe@example.com',
				customerPhone: '+1234567890',
				shippingAddress: '123 Main St, City, State 12345',
				createdAt: '2024-06-30T10:00:00Z',
				updatedAt: '2024-06-30T10:00:00Z'
			};
			
			editData = {
				status: order.status,
				shippingAddress: order.shippingAddress
			};
			
		} catch (error) {
			console.error('Failed to load order:', error);
		} finally {
			isLoading = false;
		}
	}
	
	// Simulate API call to get order items
	async function loadOrderItems() {
		try {
			// Simulate API call to GET /orders/:id/items
			await new Promise(resolve => setTimeout(resolve, 500));
			
			orderItems = [
				{
					id: '1',
					productName: 'Product A',
					quantity: 2,
					price: 149.99,
					subtotal: 299.98
				}
			];
			
		} catch (error) {
			console.error('Failed to load order items:', error);
		}
	}
	
	// Simulate API call to update order
	async function updateOrder() {
		errors = {};
		successMessage = '';
		
		if (!editData.status) {
			errors.status = 'Status is required';
			return;
		}
		
		if (!editData.shippingAddress.trim()) {
			errors.shippingAddress = 'Shipping address is required';
			return;
		}
		
		isLoading = true;
		
		try {
			// Simulate API call to PATCH /orders/:id
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			order.status = editData.status;
			order.shippingAddress = editData.shippingAddress;
			order.updatedAt = new Date().toISOString();
			
			isEditing = false;
			successMessage = 'Order updated successfully!';
			
		} catch (error) {
			console.error('Failed to update order:', error);
			errors.submit = 'Failed to update order. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	// Simulate API call to verify order code
	async function verifyOrderCode() {
		errors = {};
		successMessage = '';
		
		if (!verifyCodeData.code.trim()) {
			errors.code = 'Verification code is required';
			return;
		}
		
		isLoading = true;
		
		try {
			// Simulate API call to POST /orders/:id/verify-code
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// Simulate successful verification
			successMessage = 'Order code verified successfully! Order has been confirmed as received.';
			order.status = 'completed';
			showVerifyCode = false;
			verifyCodeData.code = '';
			
		} catch (error) {
			console.error('Failed to verify code:', error);
			errors.verifySubmit = 'Invalid verification code. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	function getStatusColor(status) {
		switch (status) {
			case 'pending': return '#f59e0b';
			case 'completed': return '#10b981';
			case 'shipped': return '#3b82f6';
			case 'cancelled': return '#ef4444';
			default: return '#6b7280';
		}
	}
	
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	function formatCurrency(amount) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}
	
	function cancelEdit() {
		isEditing = false;
		editData = {
			status: order.status,
			shippingAddress: order.shippingAddress
		};
		errors = {};
	}
	
	onMount(() => {
		orderId = $page.params.id;
		loadOrder();
		loadOrderItems();
	});
</script>

<svelte:head>
	<title>Order Details - Patriot</title>
</svelte:head>

<div class="order-details-page">
	<div class="header">
		<div class="header-content">
			<button class="back-btn" on:click={() => goto('/client/orders')}>
				← Back to Orders
			</button>
			<h1>Order Details</h1>
		</div>
		
		{#if order && !isEditing}
			<div class="header-actions">
				<button class="btn btn-secondary" on:click={() => isEditing = true}>
					Edit Order
				</button>
				{#if order.status === 'shipped'}
					<button class="btn btn-primary" on:click={() => showVerifyCode = true}>
						Verify Delivery
					</button>
				{/if}
			</div>
		{/if}
	</div>
	
	{#if isLoading && !order}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading order details...</p>
		</div>
	{:else if order}
		{#if successMessage}
			<div class="success-banner">{successMessage}</div>
		{/if}
		
		{#if errors.submit}
			<div class="error-banner">{errors.submit}</div>
		{/if}
		
		<div class="order-card">
			<div class="order-header">
				<div class="order-info">
					<h2>{order.orderNumber}</h2>
					<span class="order-status" style="background-color: {getStatusColor(order.status)}20; color: {getStatusColor(order.status)}">
						{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
					</span>
				</div>
				<div class="order-amount">
					{formatCurrency(order.totalAmount)}
				</div>
			</div>
			
			<div class="order-content">
				<div class="order-section">
					<h3>Customer Information</h3>
					<div class="info-grid">
						<div class="info-item">
							<label>Name:</label>
							<span>{order.customerName}</span>
						</div>
						<div class="info-item">
							<label>Email:</label>
							<span>{order.customerEmail}</span>
						</div>
						<div class="info-item">
							<label>Phone:</label>
							<span>{order.customerPhone || 'Not provided'}</span>
						</div>
					</div>
				</div>
				
				<div class="order-section">
					<h3>Order Information</h3>
					<div class="info-grid">
						<div class="info-item">
							<label>Status:</label>
							{#if isEditing}
								<select bind:value={editData.status} class:error={errors.status} disabled={isLoading}>
									<option value="pending">Pending</option>
									<option value="shipped">Shipped</option>
									<option value="completed">Completed</option>
									<option value="cancelled">Cancelled</option>
								</select>
								{#if errors.status}
									<span class="error-message">{errors.status}</span>
								{/if}
							{:else}
								<span class="status-badge" style="background-color: {getStatusColor(order.status)}20; color: {getStatusColor(order.status)}">
									{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
								</span>
							{/if}
						</div>
						<div class="info-item">
							<label>Created:</label>
							<span>{formatDate(order.createdAt)}</span>
						</div>
						<div class="info-item">
							<label>Last Updated:</label>
							<span>{formatDate(order.updatedAt)}</span>
						</div>
					</div>
					
					<div class="info-item full-width">
						<label>Shipping Address:</label>
						{#if isEditing}
							<textarea
								bind:value={editData.shippingAddress}
								class:error={errors.shippingAddress}
								disabled={isLoading}
								rows="3"
							></textarea>
							{#if errors.shippingAddress}
								<span class="error-message">{errors.shippingAddress}</span>
							{/if}
						{:else}
							<span>{order.shippingAddress}</span>
						{/if}
					</div>
				</div>
				
				<div class="order-section">
					<h3>Order Items</h3>
					<div class="items-table">
						<div class="table-header">
							<span>Product</span>
							<span>Quantity</span>
							<span>Price</span>
							<span>Subtotal</span>
						</div>
						{#each orderItems as item}
							<div class="table-row">
								<span>{item.productName}</span>
								<span>{item.quantity}</span>
								<span>{formatCurrency(item.price)}</span>
								<span>{formatCurrency(item.subtotal)}</span>
							</div>
						{/each}
						<div class="table-footer">
							<span></span>
							<span></span>
							<span><strong>Total:</strong></span>
							<span><strong>{formatCurrency(order.totalAmount)}</strong></span>
						</div>
					</div>
				</div>
				
				{#if isEditing}
					<div class="edit-actions">
						<button class="btn btn-secondary" on:click={cancelEdit} disabled={isLoading}>
							Cancel
						</button>
						<button class="btn btn-primary" on:click={updateOrder} disabled={isLoading}>
							{#if isLoading}
								<span class="spinner-small"></span>
								Saving...
							{:else}
								Save Changes
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</div>
		
		{#if showVerifyCode}
			<div class="verify-modal">
				<div class="modal-content">
					<div class="modal-header">
						<h3>Verify Delivery Code</h3>
						<button class="close-btn" on:click={() => showVerifyCode = false}>×</button>
					</div>
					
					{#if errors.verifySubmit}
						<div class="error-banner">{errors.verifySubmit}</div>
					{/if}
					
					<form on:submit|preventDefault={verifyOrderCode} class="verify-form">
						<p>Enter the verification code you received to confirm delivery:</p>
						
						<div class="form-group">
							<label for="verifyCode">Verification Code</label>
							<input
								type="text"
								id="verifyCode"
								bind:value={verifyCodeData.code}
								class:error={errors.code}
								disabled={isLoading}
								placeholder="Enter verification code"
							/>
							{#if errors.code}
								<span class="error-message">{errors.code}</span>
							{/if}
						</div>
						
						<div class="modal-actions">
							<button type="button" class="btn btn-secondary" on:click={() => showVerifyCode = false} disabled={isLoading}>
								Cancel
							</button>
							<button type="submit" class="btn btn-primary" disabled={isLoading}>
								{#if isLoading}
									<span class="spinner-small"></span>
									Verifying...
								{:else}
									Verify Code
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	{:else}
		<div class="error-state">
			<h3>Order not found</h3>
			<p>The order you're looking for doesn't exist or has been removed.</p>
			<button class="btn btn-primary" on:click={() => goto('/client/orders')}>
				Back to Orders
			</button>
		</div>
	{/if}
</div>

<style>
	.order-details-page {
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 32px;
		gap: 20px;
	}
	
	.header-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.back-btn {
		background: none;
		border: none;
		color: #3b82f6;
		font-size: 16px;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}
	
	.back-btn:hover {
		text-decoration: underline;
	}
	
	.header-content h1 {
		margin: 0;
		font-size: 32px;
		font-weight: 700;
		color: #1e293b;
	}
	
	.header-actions {
		display: flex;
		gap: 12px;
	}
	
	.loading {
		text-align: center;
		padding: 48px;
	}
	
	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 16px;
	}
	
	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		display: inline-block;
		margin-right: 8px;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
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
	
	.order-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}
	
	.order-header {
		padding: 32px;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.order-info {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	
	.order-info h2 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: #1e293b;
	}
	
	.order-status,
	.status-badge {
		padding: 6px 16px;
		border-radius: 20px;
		font-size: 14px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.order-amount {
		font-size: 28px;
		font-weight: 700;
		color: #059669;
	}
	
	.order-content {
		padding: 32px;
	}
	
	.order-section {
		margin-bottom: 32px;
	}
	
	.order-section:last-child {
		margin-bottom: 0;
	}
	
	.order-section h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
	}
	
	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
	}
	
	.info-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.info-item.full-width {
		grid-column: 1 / -1;
	}
	
	.info-item label {
		font-weight: 500;
		color: #64748b;
		font-size: 14px;
	}
	
	.info-item span {
		color: #1e293b;
		font-size: 16px;
	}
	
	.info-item select,
	.info-item textarea {
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 16px;
	}
	
	.info-item select:focus,
	.info-item textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.info-item select.error,
	.info-item textarea.error {
		border-color: #dc2626;
	}
	
	.error-message {
		color: #dc2626;
		font-size: 14px;
	}
	
	.items-table {
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		overflow: hidden;
	}
	
	.table-header,
	.table-row,
	.table-footer {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 16px;
		padding: 16px;
		align-items: center;
	}
	
	.table-header {
		background: #f8fafc;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e2e8f0;
	}
	
	.table-row {
		border-bottom: 1px solid #f1f5f9;
	}
	
	.table-row:last-child {
		border-bottom: none;
	}
	
	.table-footer {
		background: #f8fafc;
		border-top: 1px solid #e2e8f0;
		font-weight: 600;
	}
	
	.edit-actions {
		display: flex;
		gap: 16px;
		justify-content: flex-end;
		margin-top: 32px;
		padding-top: 32px;
		border-top: 1px solid #e2e8f0;
	}
	
	.btn {
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		font-size: 14px;
		display: flex;
		align-items: center;
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
	
	.btn-secondary {
		background: #f8fafc;
		color: #64748b;
		border: 1px solid #d1d5db;
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #f1f5f9;
	}
	
	.verify-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 32px;
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}
	
	.modal-header h3 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #1e293b;
	}
	
	.close-btn {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #64748b;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.verify-form p {
		margin: 0 0 20px 0;
		color: #64748b;
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
	}
	
	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-group input.error {
		border-color: #dc2626;
	}
	
	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}
	
	.error-state {
		text-align: center;
		padding: 48px;
		background: white;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}
	
	.error-state h3 {
		margin: 0 0 8px 0;
		font-size: 20px;
		color: #1e293b;
	}
	
	.error-state p {
		margin: 0 0 24px 0;
		color: #64748b;
	}
	
	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.order-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}
		
		.info-grid {
			grid-template-columns: 1fr;
		}
		
		.table-header,
		.table-row,
		.table-footer {
			grid-template-columns: 1fr;
			gap: 8px;
		}
		
		.edit-actions {
			flex-direction: column;
		}
	}
</style>

