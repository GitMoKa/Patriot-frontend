<script>
	import { createEventDispatcher } from 'svelte';
	
	export let currentPage = 0; // 0-based page index as required by API
	export let totalPages = 1;
	export let totalItems = 0;
	export let itemsPerPage = 10;
	export let showPageNumbers = true;
	export let maxVisiblePages = 7; // Show more page numbers
	
	const dispatch = createEventDispatcher();
	
	// Calculate display values (1-based for user display)
	$: displayCurrentPage = currentPage + 1;
	$: displayTotalPages = Math.max(5, totalPages); // Always show at least 5 pages for navigation
	
	// Calculate visible page numbers around current page
	$: visiblePages = calculateVisiblePages(currentPage, Math.max(5, totalPages), maxVisiblePages);
	
	function calculateVisiblePages(current, total, maxVisible) {
		// Always show at least some page numbers, even if total is 0 or 1
		const actualTotal = Math.max(total, 5); // Show at least 5 pages for navigation
		
		if (actualTotal <= maxVisible) {
			return Array.from({ length: actualTotal }, (_, i) => i);
		}
		
		const half = Math.floor(maxVisible / 2);
		let start = Math.max(0, current - half);
		let end = Math.min(actualTotal - 1, start + maxVisible - 1);
		
		// Adjust start if we're near the end
		if (end - start + 1 < maxVisible) {
			start = Math.max(0, end - maxVisible + 1);
		}
		
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}
	
	function goToPage(page) {
		if (page >= 0 && page !== currentPage) {
			dispatch('pageChange', { page });
		}
	}
	
	function goToPrevious() {
		if (currentPage > 0) {
			goToPage(currentPage - 1);
		}
	}
	
	function goToNext() {
		goToPage(currentPage + 1);
	}
	
	function goToFirst() {
		goToPage(0);
	}
	
	function goToLast() {
		goToPage(totalPages - 1);
	}
</script>

<!-- Always show pagination component -->
	<div class="pagination">
		<div class="pagination-info">
			<span class="page-info">
				Page {displayCurrentPage} of {displayTotalPages}
			</span>
			{#if totalItems > 0}
				<span class="items-info">
					({totalItems} total items)
				</span>
			{/if}
		</div>
		
		<div class="pagination-controls">
			<!-- Previous button -->
			<button 
				class="nav-btn"
				on:click={goToPrevious}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span class="nav-text">Previous</span>
			</button>
			
			<!-- First page button (always show if not in visible range) -->
			{#if showPageNumbers && totalPages > maxVisiblePages && visiblePages.length > 0 && !visiblePages.includes(0)}
				<button 
					class="page-btn"
					class:active={0 === currentPage}
					on:click={() => goToPage(0)}
				>
					1
				</button>
				{#if visiblePages[0] > 1}
					<span class="page-ellipsis">...</span>
				{/if}
			{/if}
			
			<!-- Page numbers -->
			{#if showPageNumbers}
				{#each visiblePages as page}
					<button 
						class="page-btn"
						class:active={page === currentPage}
						on:click={() => goToPage(page)}
					>
						{page + 1}
					</button>
				{/each}
			{/if}
			
			<!-- Last page button (always show if not in visible range) -->
			{#if showPageNumbers && totalPages > maxVisiblePages && visiblePages.length > 0 && !visiblePages.includes(totalPages - 1)}
				{#if visiblePages[visiblePages.length - 1] < totalPages - 2}
					<span class="page-ellipsis">...</span>
				{/if}
				<button 
					class="page-btn"
					class:active={totalPages - 1 === currentPage}
					on:click={() => goToPage(totalPages - 1)}
				>
					{totalPages}
				</button>
			{/if}
			
			<!-- Next button -->
			<button 
				class="nav-btn"
				on:click={goToNext}
			>
				<span class="nav-text">Next</span>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
		</div>
	</div>
<!-- End pagination component -->

<style>
	.pagination {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0;
		padding: 1.5rem;
		background: white;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.pagination-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		text-align: center;
	}
	
	.page-info {
		font-weight: 600;
		color: #1e293b;
		font-size: 0.875rem;
	}
	
	.items-info {
		font-size: 0.75rem;
		color: #64748b;
	}
	
	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	
	.nav-btn, .page-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
		min-height: 36px;
	}
	
	.page-btn {
		min-width: 40px;
		justify-content: center;
		padding: 0.5rem;
		font-weight: 600;
		background: #f8fafc;
		border: 2px solid #e2e8f0;
	}
	
	.nav-btn:hover:not(:disabled), .page-btn:hover:not(:disabled) {
		background: #f8fafc;
		border-color: #3b82f6;
		color: #3b82f6;
		transform: translateY(-1px);
	}
	
	.page-btn.active {
		background: #3b82f6;
		border-color: #3b82f6;
		color: white;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
		transform: scale(1.05);
		font-weight: 700;
	}
	
	.page-btn.active:hover {
		background: #2563eb;
		border-color: #2563eb;
		transform: translateY(-1px);
	}
	
	.nav-btn:disabled, .page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
	
	.nav-btn:disabled:hover, .page-btn:disabled:hover {
		background: white;
		border-color: #d1d5db;
		color: #374151;
		transform: none;
	}
	
	.page-ellipsis {
		color: #64748b;
		font-weight: 500;
		padding: 0.5rem;
		font-size: 0.875rem;
	}
	
	/* Dark theme support */
	:global([data-theme="dark"]) .pagination {
		background: #1e293b;
		border-color: #334155;
	}
	
	:global([data-theme="dark"]) .nav-btn,
	:global([data-theme="dark"]) .page-btn {
		background: #334155;
		border-color: #475569;
		color: #e2e8f0;
	}
	
	:global([data-theme="dark"]) .nav-btn:hover:not(:disabled),
	:global([data-theme="dark"]) .page-btn:hover:not(:disabled) {
		background: #475569;
		border-color: #60a5fa;
		color: #60a5fa;
	}
	
	:global([data-theme="dark"]) .page-btn.active {
		background: #3b82f6;
		border-color: #3b82f6;
		color: white;
	}
	
	:global([data-theme="dark"]) .nav-btn:disabled:hover,
	:global([data-theme="dark"]) .page-btn:disabled:hover {
		background: #334155;
		border-color: #475569;
		color: #e2e8f0;
	}
	
	:global([data-theme="dark"]) .page-info {
		color: #e2e8f0;
	}
	
	:global([data-theme="dark"]) .items-info {
		color: #94a3b8;
	}
	
	:global([data-theme="dark"]) .page-ellipsis {
		color: #94a3b8;
	}
	
	/* Responsive design */
	@media (max-width: 768px) {
		.pagination {
			padding: 1rem;
		}
		
		.pagination-controls {
			gap: 0.25rem;
		}
		
		.nav-btn, .page-btn {
			padding: 0.375rem 0.5rem;
			font-size: 0.8rem;
			min-height: 32px;
		}
		
		.page-btn {
			min-width: 32px;
		}
		
		.nav-text {
			display: none;
		}
		
		/* Hide some page numbers on mobile */
		.pagination-controls {
			max-width: 100%;
			overflow-x: auto;
		}
	}
	
	@media (max-width: 480px) {
		.pagination-info {
			font-size: 0.8rem;
		}
		
		.page-info {
			font-size: 0.8rem;
		}
		
		.items-info {
			font-size: 0.7rem;
		}
	}
</style>