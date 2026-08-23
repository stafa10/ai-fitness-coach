<script>
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';

	const i18n = getI18n();
	const t = i18n.t;
</script>

<svelte:head>
	<title>AI Coach | AI Fitness Coach</title>
</svelte:head>

<div class="page motion-in">
	<div class="empty-card">
		<div class="empty-icon"><Icon name="dumbbell" size={26} /></div>
		<h1>{t('coach.setupTitle')}</h1>
		<p>{t('coach.setupText')}</p>
		<Button href="/profile" variant="primary">{t('coach.createProfile')}</Button>
	</div>
</div>

<style>
	.page {
		min-height: calc(100vh - 65px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}
	.empty-card {
		text-align: center;
		background: var(--bg-panel);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 3rem 2rem;
		max-width: 400px;
		box-shadow: var(--shadow-panel);
	}
	.empty-icon {
		width: 56px;
		height: 56px;
		margin: 0 auto 1rem;
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-accent);
		box-shadow: var(--shadow-glow-blue);
	}
	.empty-card h1 {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.empty-card p {
		color: var(--text-muted);
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}
</style>
