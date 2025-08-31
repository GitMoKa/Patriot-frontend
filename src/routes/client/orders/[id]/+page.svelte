<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { languageStore } from '$lib/stores/language.js';
	
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
	
	// Item details modal
	let showItemModal = false;
	let selectedItem = null;
	
	// Load order details from API
	async function loadOrder() {
		isLoading = true;
		try {
			// Import the orders service
			const { ordersService } = await import('$lib/services/orders.js');
			
			// Get order details from API
			const response = await ordersService.getOrderById(orderId);
			order = response;
			
		} catch (error) {
			console.error('Failed to load order:', error);
		} finally {
			isLoading = false;
		}
	}
	
	// Load order items from API
	async function loadOrderItems() {
		try {
			// Import the orders service
			const { ordersService } = await import('$lib/services/orders.js');
			
			// Get order items from API
			const response = await ordersService.getOrderItems(orderId);
			
			// Handle the response structure - it should be an array of items
			orderItems = Array.isArray(response) ? response : (response.items || response.results || []);
			
		} catch (error) {
			console.error('Failed to load order items:', error);
			orderItems = [];
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
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	function formatAddress(address) {
		if (!address) return 'No address provided';
		
		const parts = [];
		if (address.street1) parts.push(address.street1);
		if (address.street2) parts.push(address.street2);
		if (address.apartment) parts.push(`Apt ${address.apartment}`);
		if (address.complex) parts.push(address.complex);
		if (address.postalCode) parts.push(address.postalCode);
		
		return parts.join(', ') || 'Address incomplete';
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
	
	function openItemDetails(item) {
		selectedItem = item;
		showItemModal = true;
	}
	
	function closeItemModal() {
		showItemModal = false;
		selectedItem = null;
	}
	
	// Helper function to get localized text
	function getLocalizedText(textObj, fallback = 'N/A') {
		if (!textObj) return fallback;
		if (typeof textObj === 'string') return textObj;
		
		let currentLang = 'en';
		languageStore.subscribe(lang => currentLang = lang)();
		
		return textObj[currentLang] || textObj.en || textObj.ar || fallback;
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
		
		{#if order}
			<div class="header-actions">
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
					<h2>#{order.ref || order.id}</h2>
					<span class="order-status" style="background-color: {getStatusColor(order.status)}20; color: {getStatusColor(order.status)}">
						{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
					</span>
				</div>
				<div class="order-priority">
					<span class="priority-badge priority-{order.priority}">
						{order.priority?.charAt(0).toUpperCase() + order.priority?.slice(1)} Priority
					</span>
				</div>
			</div>
			
			<div class="order-content">
				<div class="order-section">
					<h3>Customer Information</h3>
					<div class="info-grid">
						<div class="info-item">
							<label>Name:</label>
							<span>{order.user?.name || 'Unknown'}</span>
						</div>
						<div class="info-item">
							<label>Email:</label>
							<span>{order.user?.email || 'No email'}</span>
						</div>
						<div class="info-item">
							<label>Phone:</label>
							<span>{order.user?.phoneNumber || 'Not provided'}</span>
						</div>
					</div>
				</div>
				
				<div class="order-section">
					<h3>Order Information</h3>
					<div class="info-grid">
						<div class="info-item">
							<label>Status:</label>
							<span class="status-badge" style="background-color: {getStatusColor(order.status)}20; color: {getStatusColor(order.status)}">
								{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
							</span>
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
						<span>{formatAddress(order.address)}</span>
					</div>
					{#if order.note}
						<div class="info-item full-width">
							<label>Note:</label>
							<span>{order.note}</span>
						</div>
					{/if}
				</div>
				
				<div class="order-section">
					<h3>Order Items</h3>
					{#if orderItems.length > 0}
						<div class="items-grid">
							{#each orderItems as item}
								<div class="item-card" on:click={() => openItemDetails(item)}>
									<div class="item-card-header">
										<span class="item-id">#{item.id.slice(0, 8)}...</span>
										<span class="status-badge" style="background-color: {getStatusColor(item.status)}20; color: {getStatusColor(item.status)}">
											{item.status.charAt(0).toUpperCase() + item.status.slice(1)}
										</span>
									</div>
									<div class="item-card-content">
										<div class="item-info">
											<span class="item-label">Dimensions:</span>
											<span class="item-value">{item.width} × {item.height}</span>
										</div>
										{#if item.price}
											<div class="item-info">
												<span class="item-label">Price:</span>
												<span class="item-value">{formatCurrency(item.price)}</span>
											</div>
										{/if}
									</div>
									<div class="item-card-footer">
										<span class="created-date">{formatDate(item.createdAt)}</span>
										<span class="click-hint">Click for details</span>
									</div>
								</div>
							{/each}
						</div>
						{#if order.totalAmount}
							<div class="order-total">
								<span class="total-label">Total Amount:</span>
								<span class="total-amount">{formatCurrency(order.totalAmount)}</span>
							</div>
						{/if}
					{:else}
						<div class="empty-items">
							<p>No items found for this order.</p>
						</div>
					{/if}
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
		
		{#if showItemModal && selectedItem}
			<div class="item-modal">
				<div class="modal-content">
					<div class="modal-header">
						<h3>Item Details</h3>
						<button class="close-btn" on:click={closeItemModal}>×</button>
					</div>
					
					<div class="item-details">
						<div class="item-detail-section">
							<h4>Basic Information</h4>
							<div class="detail-grid">
								<div class="detail-item">
									<label>Item ID:</label>
									<span>#{selectedItem.id}</span>
								</div>
								<div class="detail-item">
									<label>Status:</label>
									<span class="status-badge" style="background-color: {getStatusColor(selectedItem.status)}20; color: {getStatusColor(selectedItem.status)}">
										{selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
									</span>
								</div>
								<div class="detail-item">
									<label>Dimensions:</label>
									<span>{selectedItem.width} × {selectedItem.height}</span>
								</div>
								{#if selectedItem.price}
									<div class="detail-item">
										<label>Price:</label>
										<span>{formatCurrency(selectedItem.price)}</span>
									</div>
								{/if}
								<div class="detail-item">
									<label>Created:</label>
									<span>{formatDate(selectedItem.createdAt)}</span>
								</div>
								<div class="detail-item">
									<label>Updated:</label>
									<span>{formatDate(selectedItem.updatedAt)}</span>
								</div>
							</div>
						</div>
						
						{#if selectedItem.note}
							<div class="item-detail-section">
								<h4>Note</h4>
								<p class="item-note">{selectedItem.note}</p>
							</div>
						{/if}
						
						{#if selectedItem.material}
							<div class="item-detail-section">
								<h4>Material</h4>
								<div class="material-info">
									<div class="material-name">
										<strong>{getLocalizedText(selectedItem.material.name, 'Unknown Material')}</strong>
									</div>
									{#if selectedItem.material.description}
										<div class="material-description">
											{getLocalizedText(selectedItem.material.description)}
										</div>
									{/if}
								</div>
							</div>
						{/if}
						
						{#if selectedItem.stagePattern}
							<div class="item-detail-section">
								<h4>Stage Pattern</h4>
								<div class="pattern-card-detail">
									{#if selectedItem.stagePattern.imageUrl}
										<img src={selectedItem.stagePattern.imageUrl} alt="Stage Pattern" class="pattern-image" />
									{/if}
									<div class="pattern-info">
										<span class="pattern-title">
											{selectedItem.stagePattern.title?.en || selectedItem.stagePattern.title?.ar || selectedItem.stagePattern.title || 'Untitled Pattern'}
										</span>
									</div>
								</div>
							</div>
						{/if}
						
						{#if selectedItem.patternImageUrl}
							<div class="item-detail-section">
								<h4>Custom Pattern Image</h4>
								<div class="custom-pattern">
									<img src={selectedItem.patternImageUrl} alt="Custom Pattern" class="custom-pattern-image" />
								</div>
							</div>
						{/if}
						
						{#if selectedItem.currentStage}
							<div class="item-detail-section">
								<h4>Current Stage</h4>
								<div class="stage-info">
									<span>{selectedItem.currentStage.name?.en || selectedItem.currentStage.name?.ar || selectedItem.currentStage.name || 'Unknown Stage'}</span>
									{#if selectedItem.currentStage.description}
										<p class="stage-description">
											{selectedItem.currentStage.description?.en || selectedItem.currentStage.description?.ar || selectedItem.currentStage.description}
										</p>
									{/if}
								</div>
							</div>
						{/if}
					</div>
					
					<div class="modal-actions">
						<button type="button" class="btn btn-secondary" on:click={closeItemModal}>
							Close
						</button>
					</div>
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
	/* Priority badges */
	.order-priority {
		display: flex;
		align-items: center;
	}

	.priority-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.priority-low {
		background-color: #dbeafe;
		color: #1e40af;
	}

	.priority-medium {
		background-color: #fef3c7;
		color: #92400e;
	}

	.priority-high {
		background-color: #fee2e2;
		color: #dc2626;
	}

	.empty-items {
		text-align: center;
		padding: 2rem;
		background: var(--bg-secondary);
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.empty-items p {
		color: var(--text-secondary);
		margin: 0;
		font-style: italic;
	}

	/* Item cards styles */
	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.item-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 16px;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.item-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transform: translateY(-2px);
	}

	.item-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.item-id {
		font-weight: 600;
		color: #1e293b;
		font-size: 16px;
	}

	.item-card-content {
		margin-bottom: 12px;
	}

	.item-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.item-label {
		font-size: 14px;
		color: #64748b;
		font-weight: 500;
	}

	.item-value {
		font-size: 14px;
		color: #1e293b;
		font-weight: 600;
	}

	.item-card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 12px;
		border-top: 1px solid #f1f5f9;
	}

	.created-date {
		font-size: 12px;
		color: #64748b;
	}

	.click-hint {
		font-size: 12px;
		color: #3b82f6;
		font-weight: 500;
	}

	.order-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		margin-top: 16px;
	}

	.total-label {
		font-size: 16px;
		font-weight: 600;
		color: #374151;
	}

	.total-amount {
		font-size: 18px;
		font-weight: 700;
		color: #059669;
	}

	/* Item modal styles */
	.item-modal {
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

	.item-modal .modal-content {
		max-width: 600px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.item-details {
		margin-bottom: 24px;
	}

	.item-detail-section {
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid #f1f5f9;
	}

	.item-detail-section:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.item-detail-section h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		font-weight: 600;
		color: #1e293b;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.detail-item label {
		font-size: 14px;
		font-weight: 500;
		color: #64748b;
	}

	.detail-item span {
		font-size: 14px;
		color: #1e293b;
	}

	.item-note {
		background: #f8fafc;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		margin: 0;
		color: #374151;
		font-size: 14px;
		line-height: 1.5;
	}

	.material-info {
		background: #f0f9ff;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #bae6fd;
	}

	.material-name {
		margin-bottom: 8px;
	}

	.material-description {
		font-size: 14px;
		color: #0369a1;
		line-height: 1.4;
		font-style: italic;
	}

	.pattern-card-detail {
		display: flex;
		gap: 12px;
		align-items: center;
		background: #f8fafc;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}

	.pattern-image {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 4px;
		border: 1px solid #d1d5db;
	}

	.pattern-info {
		flex: 1;
	}

	.pattern-title {
		font-weight: 500;
		color: #1e293b;
	}

	.custom-pattern {
		text-align: center;
	}

	.custom-pattern-image {
		max-width: 100%;
		max-height: 200px;
		object-fit: contain;
		border-radius: 6px;
		border: 1px solid #d1d5db;
	}

	.stage-info {
		background: #fef3c7;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #fcd34d;
	}

	.stage-description {
		margin: 8px 0 0 0;
		font-size: 14px;
		color: #92400e;
		line-height: 1.4;
	}

	@media (max-width: 768px) {
		.items-grid {
			grid-template-columns: 1fr;
		}

		.item-card-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.item-card-footer {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.order-total {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.detail-grid {
			grid-template-columns: 1fr;
		}

		.pattern-card-detail {
			flex-direction: column;
			text-align: center;
		}
	}
</style>

