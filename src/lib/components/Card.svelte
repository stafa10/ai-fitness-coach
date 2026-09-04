<script>
	let { accent = undefined, padded = true, children } = $props();
</script>

<div class="card" class:padded style={accent ? `--card-accent:${accent}` : undefined}>
	{#if accent}<div class="accent-bar"></div>{/if}
	{@render children()}
</div>

<style>
	.card {
		position: relative;
		height: 100%;
		box-sizing: border-box;
		background: var(--bg-panel);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition:
			transform var(--motion-base) var(--ease-out),
			border-color var(--motion-base) ease,
			box-shadow var(--motion-base) var(--ease-out);
	}
	.card:hover {
		transform: translateY(-3px);
		border-color: color-mix(
			in srgb,
			var(--card-accent, var(--accent-blue)) 45%,
			var(--border-subtle)
		);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
	}
	.padded {
		padding: 1.6rem;
	}
	.accent-bar {
		position: absolute;
		left: 0;
		top: 0;
		width: 5px;
		height: 100%;
		background: linear-gradient(to bottom, var(--card-accent, var(--accent-blue)), transparent);
	}
</style>
