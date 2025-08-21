<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ordersService } from '$lib/services/orders.js';
	
	let orders = [];
	let isLoading = false;
	let statusFilter = 'all';
	let currentPage = 1;
	let totalPages = 1;
	let itemsPerPage = 10;
	
	// Get status filter from URL parameters
	$: if ($page.url.searchParams.has('status')) {
		statusFilter = $page.url.searchParams.get('status') || 'all';
	}
	
	async function loadOrders() {
		isLoading = true;
		try {
			const response = await ordersService.getAllOrders();
			orders = response.orders || response.results || response;
			totalPages = Math.ceil(orders.length / itemsPerPage);
			console.log(`Loaded ${response.total || orders.length} orders for current user`);
		} catch (error) {
			console.error('Failed to load orders:', error);
		} finally {
			isLoading = false;
		}
	}
	
	async function deleteOrder(orderId) {
		if (!confirm('Are you sure you want to delete this order?')) {
			return;
		}
		
		try {
			await ordersService.deleteOrder(orderId);
			orders = orders.filter(order => order.id !== orderId);
			alert('Order deleted successfully!');
		} catch (error) {
			console.error('Failed to delete order:', error);
			alert('Failed to delete order. Please try again.');
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
	
	$: filteredOrders = orders.filter(order => {
		const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
		return matchesStatus;
	});
	
	onMount(() => {
		loadOrders();
	});
</script>

<svelte:head>
	<title>Orders - Patriot</title>
</svelte:head>

<div class="orders-page">
	<div class="header">
		<div class="header-content">
			<h1>Orders</h1>
			<p>Manage and track your orders</p>
		</div>
		<a href="/client/orders/create" class="btn btn-primary">
			<span class="icon">➕</span>
			Create Order
		</a>
	</div>
	
	<div class="filters">
		<select bind:value={statusFilter} class="status-filter">
			<option value="all">All Status</option>
			<option value="pending">Pending</option>
			<option value="in-progress">In Progress</option>
			<option value="completed">Completed</option>
			<option value="cancelled">Cancelled</option>
			<option value="delivered">Delivered</option>
			<option value="out-for-delivery">Out for Delivery</option>
		</select>
	</div>
	
	{#if isLoading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading orders...</p>
		</div>
	{:else if filteredOrders.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📦</div>
			<h3>No orders found</h3>
			<p>You haven't created any orders yet or no orders match your search criteria.</p>
			<a href="/client/orders/create" class="btn btn-primary">Create Your First Order</a>
		</div>
	{:else}
		<div class="orders-grid">
			{#each filteredOrders as order (order.id)}
				<div class="order-card">
					<div class="order-header">
						<div class="order-info">
							<h3 class="order-number">#{order.ref || order.id}</h3>
							<span class="order-status" style="background-color: {getStatusColor(order.status)}20; color: {getStatusColor(order.status)}">
								{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
							</span>
						</div>
						<div class="order-priority">
							<span class="priority-badge priority-{order.priority}">
								{order.priority.charAt(0).toUpperCase() + order.priority.slice(1)} Priority
							</span>
						</div>
					</div>
					
					<div class="order-details">
						<p class="order-date">Created: {formatDate(order.createdAt)}</p>
						<p class="order-date">Updated: {formatDate(order.updatedAt)}</p>
						{#if order.note}
							<p class="order-note">Note: {order.note}</p>
						{/if}
						<p class="order-address">
							<strong>Address:</strong> {formatAddress(order.address)}
						</p>
						<p class="order-user">
							<strong>Customer:</strong> {order.user?.name || 'Unknown'} ({order.user?.email || 'No email'})
							{#if order.user?.phoneNumber}
								- {order.user.phoneNumber}
							{/if}
						</p>
						{#if order.outForDeliveryAt}
							<p class="order-delivery">Out for delivery: {formatDate(order.outForDeliveryAt)}</p>
						{/if}
						{#if order.deliveredAt}
							<p class="order-delivery">Delivered: {formatDate(order.deliveredAt)}</p>
						{/if}
					</div>
					
					<div class="order-actions">
						<button 
							class="btn btn-secondary btn-sm"
							on:click={() => goto(`/client/orders/${order.id}`)}
						>
							View Details
						</button>
						<button 
							class="btn btn-danger btn-sm"
							on:click={() => deleteOrder(order.id)}
						>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
		
		{#if totalPages > 1}
			<div class="pagination">
				<button 
					class="btn btn-secondary"
					disabled={currentPage === 1}
					on:click={() => currentPage--}
				>
					Previous
				</button>
				<span class="page-info">Page {currentPage} of {totalPages}</span>
				<button 
					class="btn btn-secondary"
					disabled={currentPage === totalPages}
					on:click={() => currentPage++}
				>
					Next
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.orders-page {
		max-width: 100%;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 32px;
		gap: 20px;
	}
	
	.header-content h1 {
		margin: 0 0 8px 0;
		font-size: 32px;
		font-weight: 700;
		color: #1e293b;
	}
	
	.header-content p {
		margin: 0;
		color: #64748b;
		font-size: 16px;
	}
	
	.filters {
		display: flex;
		gap: 16px;
		margin-bottom: 24px;
		flex-wrap: wrap;
		justify-content: flex-end; /* Adjust alignment after removing search */
	}
	
	.search-box {
		flex: 1;
		min-width: 250px;
	}
	
	.search-input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 16px;
	}
	
	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.status-filter {
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 16px;
		background: white;
		min-width: 150px;
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
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.empty-state {
		text-align: center;
		padding: 48px;
		background: white;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}
	
	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}
	
	.empty-state h3 {
		margin: 0 0 8px 0;
		font-size: 20px;
		color: #1e293b;
	}
	
	.empty-state p {
		margin: 0 0 24px 0;
		color: #64748b;
	}
	
	.orders-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 20px;
		margin-bottom: 32px;
	}
	
	.order-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		transition: all 0.2s ease;
	}
	
	.order-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
	}
	
	.order-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.order-number {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
	}
	
	.order-status {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		width: fit-content;
	}
	
	.order-amount {
		font-size: 20px;
		font-weight: 700;
		color: #059669;
	}
	
	.order-details {
		margin-bottom: 20px;
	}
	
	.order-details p {
		margin: 0 0 4px 0;
		color: #64748b;
		font-size: 14px;
	}
	
	.order-actions {
		display: flex;
		gap: 8px;
	}
	
	.btn {
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		font-size: 14px;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		justify-content: center;
	}
	
	.btn-sm {
		padding: 6px 12px;
		font-size: 12px;
	}
	
	.btn-primary {
		background: #3b82f6;
		color: white;
	}
	
	.btn-primary:hover {
		background: #2563eb;
	}
	
	.btn-secondary {
		background: #f8fafc;
		color: #64748b;
		border: 1px solid #d1d5db;
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #f1f5f9;
	}
	
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-danger {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}
	
	.btn-danger:hover {
		background: #fee2e2;
	}
	
	.icon {
		font-size: 16px;
	}
	
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 16px;
		margin-top: 32px;
	}
	
	.page-info {
		color: #64748b;
		font-size: 14px;
	}
	
	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.filters {
			flex-direction: column;
		}
		
		.orders-grid {
			grid-template-columns: 1fr;
		}
		
		.order-actions {
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

	/* Order details */
	.order-note {
		font-style: italic;
		color: #6b7280;
		margin: 0.5rem 0;
		font-size: 0.875rem;
	}

	.order-address {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		line-height: 1.4;
		color: #374151;
	}

	.order-delivery {
		font-size: 0.875rem;
		color: #059669;
		font-weight: 500;
		margin: 0.25rem 0;
	}

	.order-user {
		margin: 0.5rem 0;
		font-size: 0.875rem;
		line-height: 1.4;
		color: #374151;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.order-actions {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.btn-sm {
			width: 100%;
			justify-content: center;
		}
		
		.order-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}
</style>