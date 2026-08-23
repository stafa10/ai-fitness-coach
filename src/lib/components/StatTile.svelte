<script>
	let { value, label, icon = undefined } = $props();
</script>

<div class="stat">
	{#if icon}
		<div class="stat-icon">{@render icon()}</div>
	{/if}
	<span class="value">{value}</span>
	<span class="label">{label}</span>
</div>

<style>
	.stat {
		padding: 28px 16px;
		border-radius: var(--radius-lg);
		min-height: 140px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-subtle);
		transition:
			transform var(--motion-base) var(--ease-out),
			border-color var(--motion-base) ease,
			box-shadow var(--motion-base) var(--ease-out);
		text-align: center;
	}
	.stat:hover {
		transform: translateY(-4px) scale(1.02);
		border-color: var(--accent-blue);
		box-shadow: 0 14px 32px rgba(124, 58, 237, 0.3);
	}
	.stat-icon {
		color: var(--accent-volt);
		margin-bottom: 6px;
	}
	.value {
		display: block;
		font-family: var(--font-display);
		font-size: 2.6rem;
		font-weight: 700;
		background: var(--gradient-accent);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.label {
		display: block;
		margin-top: 8px;
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
	}
</style>
