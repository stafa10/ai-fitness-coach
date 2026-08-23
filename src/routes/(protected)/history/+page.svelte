<script>
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import SessionCard from '$lib/components/SessionCard.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';

	const i18n = getI18n();
	const t = i18n.t;

	let { data } = $props();

	const sessions = $derived(data?.sessions ?? []);
	const page = $derived(data?.page ?? 1);
	const totalPages = $derived(data?.totalPages ?? 0);
</script>

<svelte:head>
	<title>Workout History | AI Fitness Coach</title>
</svelte:head>

<div class="page motion-in">
	<div class="header">
		<div class="header-left">
			<div class="header-icon"><Icon name="chart" size={22} /></div>
			<div>
				<h1>{t('history.title')}</h1>
				<p class="sub">{t('history.subtitle')}</p>
			</div>
		</div>
		<Button href="/workout-log" variant="ghost" size="sm">
			<Icon name="chevronLeft" size={14} />
			{t('history.workoutLog')}
		</Button>
	</div>

	{#if data?.needsProfile}
		<div class="notice">
			<Icon name="alert" size={16} />
			{t('history.needsProfileNotice')}
			<Button href="/profile" variant="primary" size="sm">{t('history.createProfile')}</Button>
		</div>
	{:else if sessions.length === 0}
		<p class="empty">{t('history.empty')}</p>
	{:else}
		{#each sessions as s (s.session.id)}
			<SessionCard session={s} />
		{/each}

		{#if totalPages > 1}
			<div class="pager">
				{#if page > 1}
					<Button href={`/history?page=${page - 1}`} variant="ghost" size="sm">
						<Icon name="chevronLeft" size={14} />
						{t('history.newer')}
					</Button>
				{:else}
					<Button variant="ghost" size="sm" disabled>
						<Icon name="chevronLeft" size={14} />
						{t('history.newer')}
					</Button>
				{/if}
				<span class="pager-label">{t('history.pageLabel', { page, total: totalPages })}</span>
				{#if page < totalPages}
					<Button href={`/history?page=${page + 1}`} variant="ghost" size="sm"
						>{t('history.older')}</Button
					>
				{:else}
					<Button variant="ghost" size="sm" disabled>{t('history.older')}</Button>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1.5rem 3rem;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.8rem;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}
	.header-icon {
		width: 48px;
		height: 48px;
		background: var(--gradient-accent);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-glow-blue);
		flex-shrink: 0;
	}
	h1 {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.5px;
	}
	.sub {
		font-size: 0.85rem;
		color: var(--text-faint);
		margin: 0.15rem 0 0;
	}
	.notice {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-bottom: 1.75rem;
		padding: 0.9rem 1.2rem;
		border-radius: var(--radius-md);
		background: rgba(124, 58, 237, 0.1);
		border: 1px solid rgba(124, 58, 237, 0.3);
		color: #ddd6fe;
		font-size: 0.9rem;
	}
	.empty {
		color: var(--text-faint);
		font-style: italic;
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.2rem;
		margin-top: 1.5rem;
	}
	.pager-label {
		font-size: 0.85rem;
		color: var(--text-faint);
		font-weight: 600;
	}
</style>
