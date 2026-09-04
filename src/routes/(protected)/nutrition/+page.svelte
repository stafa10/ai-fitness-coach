<script>
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import StatTile from '$lib/components/StatTile.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';
	import { computeNutritionTargets } from '$lib/nutritionCalc.js';

	const i18n = getI18n();
	const t = i18n.t;

	let { data, form } = $props();

	const profile = $derived(data.profile);
	const library = $derived(data.library ?? []);
	const todayLog = $derived(data.todayLog ?? []);
	const targets = $derived(computeNutritionTargets(profile));

	const todayTotals = $derived.by(() => {
		return todayLog.reduce(
			(acc, entry) => {
				const mult = Number(entry.servings);
				acc.calories += Math.round(entry.calories * mult);
				acc.protein += Math.round(entry.protein * mult);
				acc.carbs += Math.round(entry.carbs * mult);
				acc.fats += Math.round(entry.fats * mult);
				return acc;
			},
			{ calories: 0, protein: 0, carbs: 0, fats: 0 }
		);
	});

	function pct(value, target) {
		if (!target) return 0;
		return Math.min(100, Math.round((value / target) * 100));
	}

	let logFoodId = $state('');
	let logServings = $state(1);

	let showAddFood = $state(false);
</script>

<svelte:head>
	<title>{t('nutrition.title')} | AI Fitness Coach</title>
</svelte:head>

<div class="page motion-in">
	<div class="header">
		<div class="header-left">
			<div class="header-icon"><Icon name="flame" size={22} /></div>
			<div>
				<h1>{t('nutrition.title')}</h1>
				<p class="sub">{t('nutrition.subtitle')}</p>
			</div>
		</div>
	</div>

	{#if !profile}
		<div class="notice">
			<Icon name="alert" size={16} />
			{t('nutrition.needsProfileNotice')}
			<Button href="/profile" variant="primary" size="sm">{t('nutrition.createProfile')}</Button>
		</div>
	{:else}
		<div class="panel targets-panel">
			<div class="panel-head">
				<div class="panel-icon"><Icon name="target" size={16} /></div>
				<h2>{t('nutrition.todaysTargets')}</h2>
			</div>
			<div class="targets-grid">
				<StatTile value={targets.calories} label={t('dashboard.calories')} />
				<StatTile value="{targets.protein}g" label={t('dashboard.protein')} />
				<StatTile value="{targets.carbs}g" label={t('dashboard.carbohydrates')} />
				<StatTile value="{targets.fats}g" label={t('dashboard.fats')} />
			</div>

			<div class="progress-rows">
				<div class="progress-row">
					<span>{t('nutrition.calories')} · {todayTotals.calories} / {targets.calories}</span>
					<div class="progress-bar">
						<div
							class="progress-fill cal"
							style="width: {pct(todayTotals.calories, targets.calories)}%"
						></div>
					</div>
				</div>
				<div class="progress-row">
					<span>{t('dashboard.protein')} · {todayTotals.protein}g / {targets.protein}g</span>
					<div class="progress-bar">
						<div
							class="progress-fill protein"
							style="width: {pct(todayTotals.protein, targets.protein)}%"
						></div>
					</div>
				</div>
				<div class="progress-row">
					<span>{t('dashboard.carbohydrates')} · {todayTotals.carbs}g / {targets.carbs}g</span>
					<div class="progress-bar">
						<div
							class="progress-fill carbs"
							style="width: {pct(todayTotals.carbs, targets.carbs)}%"
						></div>
					</div>
				</div>
				<div class="progress-row">
					<span>{t('dashboard.fats')} · {todayTotals.fats}g / {targets.fats}g</span>
					<div class="progress-bar">
						<div
							class="progress-fill fats"
							style="width: {pct(todayTotals.fats, targets.fats)}%"
						></div>
					</div>
				</div>
			</div>
		</div>

		<div class="main-grid">
			<div class="panel log-panel">
				<div class="panel-head">
					<div class="panel-icon"><Icon name="clock" size={16} /></div>
					<h2>{t('nutrition.todaysLog')}</h2>
				</div>

				{#if library.length === 0}
					<p class="empty">{t('nutrition.noFoodsYet')}</p>
				{:else}
					<form method="POST" action="?/logFood" class="log-form">
						<select name="foodId" bind:value={logFoodId} required>
							<option value="" disabled>{t('nutrition.selectFood')}</option>
							{#each library as food (food.id)}
								<option value={food.id}
									>{food.name} · {food.servingSize} ({food.calories} kcal)</option
								>
							{/each}
						</select>
						<input
							type="number"
							name="servings"
							bind:value={logServings}
							min="0.25"
							step="0.25"
							class="servings-input"
						/>
						<Button type="submit" variant="primary" size="sm">{t('nutrition.log')}</Button>
					</form>
				{/if}

				{#if form?.logError}
					<p class="form-error"><Icon name="alert" size={12} /> {form.logError}</p>
				{/if}

				{#if todayLog.length === 0}
					<p class="empty">{t('nutrition.emptyToday')}</p>
				{:else}
					<div class="log-list">
						{#each todayLog as entry (entry.id)}
							<div class="log-entry">
								<div>
									<strong>{entry.name}</strong>
									<p>
										{Number(entry.servings)} × {entry.servingSize} · {Math.round(
											entry.calories * Number(entry.servings)
										)} kcal
									</p>
								</div>
								<form method="POST" action="?/deleteLogEntry">
									<input type="hidden" name="logId" value={entry.id} />
									<button type="submit" class="delete-btn" aria-label={t('nutrition.removeEntry')}>
										<Icon name="trash" size={14} />
									</button>
								</form>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="panel foods-panel">
				<div class="panel-head panel-head-row">
					<div class="panel-head-left">
						<div class="panel-icon"><Icon name="dumbbell" size={16} /></div>
						<h2>{t('nutrition.myFoods')}</h2>
					</div>
					<button class="toggle-add-btn" onclick={() => (showAddFood = !showAddFood)}>
						<Icon name={showAddFood ? 'chevronLeft' : 'plus'} size={14} />
						{showAddFood ? t('nutrition.cancel') : t('nutrition.addFood')}
					</button>
				</div>

				{#if showAddFood}
					<form method="POST" action="?/addFood" class="add-food-form">
						<input type="text" name="name" placeholder={t('nutrition.foodName')} required />
						<input
							type="text"
							name="servingSize"
							placeholder={t('nutrition.servingSize')}
							required
						/>
						<div class="macro-row">
							<input type="number" name="calories" placeholder="kcal" min="1" required />
							<input type="number" name="protein" placeholder={t('nutrition.proteinG')} min="0" />
							<input type="number" name="carbs" placeholder={t('nutrition.carbsG')} min="0" />
							<input type="number" name="fats" placeholder={t('nutrition.fatsG')} min="0" />
						</div>
						<Button type="submit" variant="primary" size="sm" full>{t('nutrition.save')}</Button>
					</form>
					{#if form?.foodError}
						<p class="form-error"><Icon name="alert" size={12} /> {form.foodError}</p>
					{/if}
				{/if}

				{#if library.length === 0}
					<p class="empty">{t('nutrition.noCustomFoods')}</p>
				{:else}
					<div class="food-list">
						{#each library as food (food.id)}
							<div class="food-row">
								<div>
									<strong>{food.name}</strong>
									<p>
										{food.servingSize} · {food.calories} kcal · {food.protein}p / {food.carbs}c / {food.fats}f
									</p>
								</div>
								<form method="POST" action="?/deleteFood">
									<input type="hidden" name="foodId" value={food.id} />
									<button type="submit" class="delete-btn" aria-label={t('nutrition.removeFood')}>
										<Icon name="trash" size={14} />
									</button>
								</form>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1100px;
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

	.panel {
		position: relative;
		background: var(--bg-panel);
		border-radius: var(--radius-lg);
		padding: 1.4rem;
		border: 1px solid var(--border-subtle);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}
	.panel::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		height: 3px;
		background: var(--accent-purple);
		opacity: 0.85;
	}
	.panel-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1.2rem;
	}
	.panel-head-row {
		justify-content: space-between;
	}
	.panel-head-left {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.panel-head h2 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.panel-icon {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: color-mix(in srgb, var(--accent-purple) 16%, transparent);
		color: var(--accent-purple);
	}

	.targets-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}
	.progress-rows {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		margin-top: 1.2rem;
	}
	.progress-row span {
		font-size: 0.78rem;
		color: var(--text-muted);
	}
	.progress-bar {
		margin-top: 0.3rem;
		height: 8px;
		border-radius: 999px;
		background: var(--bg-input);
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		border-radius: 999px;
		transition: width var(--motion-base) var(--ease-out);
	}
	.progress-fill.cal {
		background: var(--gradient-accent);
	}
	.progress-fill.protein {
		background: var(--accent-teal);
	}
	.progress-fill.carbs {
		background: var(--accent-volt);
	}
	.progress-fill.fats {
		background: var(--accent-red);
	}

	.main-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.2rem;
		align-items: start;
	}
	.log-panel,
	.foods-panel {
		margin-bottom: 0;
	}

	.log-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	.log-form select {
		flex: 1;
		min-width: 160px;
	}
	.servings-input {
		width: 80px;
	}

	input,
	select {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		padding: 0.65rem 0.8rem;
		border-radius: var(--radius-sm);
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.85rem;
		outline: none;
	}
	input:focus,
	select:focus {
		border-color: var(--accent-blue);
	}

	.add-food-form {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 1.2rem;
		padding: 1rem;
		background: var(--bg-panel-soft);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}
	.macro-row {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	.toggle-add-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.8rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-strong);
		background: var(--bg-input);
		color: var(--text-primary);
		font-size: 0.78rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
	}
	.toggle-add-btn:hover {
		border-color: var(--accent-blue);
	}

	.log-list,
	.food-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.log-entry,
	.food-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
		padding: 0.75rem 1rem;
		background: var(--bg-panel-soft);
		border: 1px solid var(--border-subtle);
		border-radius: 10px;
	}
	.log-entry strong,
	.food-row strong {
		font-size: 0.9rem;
	}
	.log-entry p,
	.food-row p {
		margin: 0.15rem 0 0;
		font-size: 0.78rem;
		color: var(--text-faint);
	}
	.delete-btn {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-subtle);
		color: var(--text-faint);
		cursor: pointer;
		transition: 0.2s;
	}
	.delete-btn:hover {
		background: rgba(239, 68, 68, 0.14);
		border-color: rgba(239, 68, 68, 0.4);
		color: var(--accent-red);
	}

	.empty {
		color: var(--text-faint);
		font-style: italic;
		font-size: 0.88rem;
	}
	.form-error {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--accent-red);
		font-size: 0.82rem;
		margin: 0 0 0.8rem;
	}

	@media (max-width: 800px) {
		.targets-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.main-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
