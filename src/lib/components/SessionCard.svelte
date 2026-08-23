<script>
	import Icon from '$lib/components/Icon.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';

	const i18n = getI18n();
	const t = i18n.t;

	let { session } = $props();

	const date = $derived(new Date(session.session.createdAt));
	const grouped = $derived(
		(session.sets ?? []).reduce((acc, set) => {
			if (!acc[set.exercise]) acc[set.exercise] = [];
			acc[set.exercise].push(set);
			return acc;
		}, {})
	);
</script>

<div class="session-card">
	<div class="session-header">
		<div>
			<h3>
				{date.toLocaleDateString(i18n.locale, {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})}
			</h3>
			<p>{date.toLocaleTimeString(i18n.locale, { hour: '2-digit', minute: '2-digit' })}</p>
		</div>
		<div class="session-header-right">
			<span class="session-badge">{t('sessionCard.setsBadge', { n: session.totalSets })}</span>
			<form
				method="POST"
				action="?/deleteSession"
				onsubmit={(e) => {
					if (!confirm(t('sessionCard.deleteConfirm'))) e.preventDefault();
				}}
			>
				<input type="hidden" name="sessionId" value={session.session.id} />
				<button
					type="submit"
					class="session-delete"
					aria-label={t('sessionCard.deleteSessionAria')}
				>
					<Icon name="trash" size={15} />
				</button>
			</form>
		</div>
	</div>

	{#if session.session.videoUrl}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video class="session-video" src={session.session.videoUrl} controls preload="metadata"></video>
	{/if}

	<div class="session-summary">
		<div class="summary-item">
			<span class="summary-value">{session.exerciseCount}</span>
			<span class="summary-label">{t('workoutLog.exercises')}</span>
		</div>
		<div class="summary-item">
			<span class="summary-value">{session.totalSets}</span>
			<span class="summary-label">{t('workoutLog.sets')}</span>
		</div>
		<div class="summary-item">
			<span class="summary-value">{Math.round(session.totalVolume).toLocaleString()}</span>
			<span class="summary-label">{t('sessionCard.volumeKg')}</span>
		</div>
	</div>

	{#each Object.entries(grouped) as [exName, sets] (exName)}
		{@const trend = session.trends?.[exName]}
		<div class="exercise-history">
			<div class="exercise-title">
				<Icon name="dumbbell" size={16} />
				{exName}
				{#if trend === 'up'}
					<span class="trend trend-up"
						><Icon name="chart" size={12} /> {t('sessionCard.trendUp')}</span
					>
				{:else if trend === 'down'}
					<span class="trend trend-down"
						><Icon name="chart" size={12} /> {t('sessionCard.trendDown')}</span
					>
				{:else if trend === 'same'}
					<span class="trend trend-same">{t('sessionCard.trendSame')}</span>
				{:else if trend === 'new'}
					<span class="trend trend-new">{t('sessionCard.trendNew')}</span>
				{/if}
			</div>
			<div class="exercise-head">
				<div>{t('workoutLog.setColumn')}</div>
				<div>{t('workoutLog.weightColumn')}</div>
				<div>{t('workoutLog.repsColumn')}</div>
			</div>
			{#each sets as set (set.id)}
				<div class="exercise-row">
					<div class="set-pill">{set.setNumber}</div>
					<div class="weight-pill">{Number(set.weight)} kg</div>
					<div class="reps-pill">{set.reps}</div>
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.session-card {
		background: rgba(15, 23, 42, 0.92);
		backdrop-filter: blur(18px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		padding: 1.8rem;
		margin-bottom: 1.8rem;
		box-shadow:
			0 20px 45px rgba(0, 0, 0, 0.35),
			0 0 40px rgba(124, 58, 237, 0.12);
		overflow: hidden;
		transition:
			transform var(--motion-base) var(--ease-out),
			border-color var(--motion-base) ease,
			box-shadow var(--motion-base) var(--ease-out);
	}
	.session-card:hover {
		transform: translateY(-3px);
		border-color: rgba(124, 58, 237, 0.4);
		box-shadow:
			0 24px 50px rgba(0, 0, 0, 0.4),
			0 0 50px rgba(124, 58, 237, 0.2);
	}
	.session-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	.session-header h3 {
		margin: 0;
		color: white;
		font-size: 1.25rem;
		font-weight: 700;
	}
	.session-header p {
		margin: 0.3rem 0 0;
		color: #94a3b8;
		font-size: 0.85rem;
	}
	.session-badge {
		padding: 0.65rem 1.2rem;
		border-radius: 999px;
		background: linear-gradient(135deg, #7c3aed, #ec4899);
		color: white;
		font-size: 0.8rem;
		font-weight: 700;
		box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35);
	}
	.session-header-right {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.session-delete {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-subtle);
		color: var(--text-faint);
		cursor: pointer;
		transition: 0.2s;
	}
	.session-delete:hover {
		background: rgba(239, 68, 68, 0.14);
		border-color: rgba(239, 68, 68, 0.4);
		color: var(--accent-red);
	}
	.session-video {
		width: 100%;
		max-height: 360px;
		border-radius: 16px;
		margin-top: 1rem;
		background: #000;
		display: block;
	}
	.session-summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-top: 18px;
	}
	.summary-item {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-subtle);
		border-radius: 14px;
		padding: 14px;
		text-align: center;
	}
	.summary-value {
		display: block;
		font-size: 1.4rem;
		font-weight: 800;
		background: var(--gradient-accent);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.summary-label {
		display: block;
		margin-top: 4px;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--text-faint);
		font-weight: 600;
	}
	.exercise-history {
		margin-top: 22px;
		background: var(--bg-panel-soft);
		border: 1px solid var(--border-strong);
		border-radius: 18px;
		padding: 22px;
	}
	.exercise-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		font-size: 1.15rem;
		font-weight: 700;
		color: white;
		margin-bottom: 18px;
	}
	.trend {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
	}
	.trend-up {
		color: var(--accent-green);
		background: rgba(34, 197, 94, 0.12);
	}
	.trend-down {
		color: var(--accent-red);
		background: rgba(239, 68, 68, 0.12);
	}
	.trend-down :global(svg) {
		transform: rotate(180deg);
	}
	.trend-same {
		color: var(--text-faint);
		background: rgba(255, 255, 255, 0.06);
	}
	.trend-new {
		color: var(--accent-blue);
		background: rgba(124, 58, 237, 0.12);
	}
	.exercise-head {
		display: grid;
		grid-template-columns: 70px 1fr 1fr;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		color: #8ba9ff;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 2px;
	}
	.exercise-row {
		display: grid;
		grid-template-columns: 70px 1fr 1fr;
		align-items: center;
		padding: 14px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}
	.exercise-row:last-child {
		border-bottom: none;
	}
	.set-pill {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-accent);
		color: white;
		font-weight: 700;
	}
	.weight-pill {
		color: var(--accent-teal);
		font-weight: 700;
		font-size: 1rem;
	}
	.reps-pill {
		color: var(--accent-green);
		font-weight: 700;
		font-size: 1rem;
	}
</style>
