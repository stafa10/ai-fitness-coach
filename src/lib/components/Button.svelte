<script>
	import { resolve } from '$app/paths';

	let {
		variant = 'primary',
		size = 'md',
		href = undefined,
		type = 'button',
		disabled = false,
		full = false,
		onclick = undefined,
		children
	} = $props();
</script>

{#if href}
	<a href={resolve(href)} class="btn {variant} {size}" class:full aria-disabled={disabled}>
		{@render children()}
	</a>
{:else}
	<button {type} class="btn {variant} {size}" class:full {disabled} {onclick}>
		{@render children()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			transform var(--motion-fast) var(--ease-spring),
			box-shadow var(--motion-base) var(--ease-out),
			border-color var(--motion-fast) ease,
			color var(--motion-fast) ease,
			background var(--motion-fast) ease;
		white-space: nowrap;
	}
	.btn.full {
		width: 100%;
	}
	.btn:disabled,
	.btn[aria-disabled='true'] {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn:active:not(:disabled) {
		transform: scale(0.96);
	}

	.md {
		padding: 0.7rem 1.3rem;
		font-size: 0.9rem;
	}
	.sm {
		padding: 0.5rem 0.9rem;
		font-size: 0.8rem;
	}
	.lg {
		padding: 0.95rem 1.6rem;
		font-size: 1rem;
	}

	.primary {
		background: var(--gradient-accent);
		color: var(--text-primary);
		box-shadow: var(--shadow-glow-blue);
	}
	.primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 14px 32px rgba(124, 58, 237, 0.45);
	}
	.primary:active:not(:disabled) {
		transform: scale(0.96);
		box-shadow: var(--shadow-glow-blue);
	}

	.ghost {
		background: var(--bg-panel);
		color: var(--text-primary);
		border-color: var(--border-strong);
	}
	.ghost:hover:not(:disabled) {
		border-color: var(--accent-blue);
		color: var(--text-primary);
		background: color-mix(in srgb, var(--accent-blue) 12%, var(--bg-panel));
	}

	.danger {
		background: transparent;
		color: var(--accent-red);
		border-color: rgba(244, 63, 94, 0.35);
	}
	.danger:hover:not(:disabled) {
		background: rgba(244, 63, 94, 0.12);
	}
</style>
