<script>
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import StatTile from '$lib/components/StatTile.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';
	import { computeNutritionTargets } from '$lib/nutritionCalc.js';

	const i18n = getI18n();
	const t = i18n.t;
	const tEnum = i18n.tEnum;

	let { data, form } = $props();

	const profile = $derived(data.profile);
	const workout = $derived(data.workout ?? []);
	const planIsStale = $derived(data.planIsStale ?? false);

	const firstName = $derived((data.userName ?? '').split(' ')[0] || t('dashboard.friendFallback'));
	const todayLabel = $derived(
		new Date().toLocaleDateString(i18n.locale, {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		})
	);

	function relativeTime(date) {
		const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
		if (days <= 0) return t('dashboard.today');
		if (days === 1) return t('dashboard.yesterday');
		if (days < 7) return t('dashboard.daysAgo', { n: days });
		const weeks = Math.floor(days / 7);
		return weeks === 1 ? t('dashboard.weekAgo') : t('dashboard.weeksAgo', { n: weeks });
	}
	const lastWorkoutLabel = $derived(
		data.logs?.[0]?.createdAt ? relativeTime(data.logs[0].createdAt) : null
	);
	const streak = $derived(data.streak ?? 0);
	const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

	const adherenceHeatmap = $derived(data.adherenceHeatmap ?? []);
	const heatmapMaxVolume = $derived(Math.max(1, ...adherenceHeatmap.flat().map((d) => d.volume)));
	const heatmapSessionCount = $derived(adherenceHeatmap.flat().filter((d) => d.done).length);
	function heatmapTier(day) {
		if (!day.done) return 0;
		const ratio = day.volume / heatmapMaxVolume;
		if (ratio > 0.66) return 3;
		if (ratio > 0.33) return 2;
		return 1;
	}
	// A "YYYY-MM-DD" string parses as UTC midnight; appending a bare local time forces it to
	// parse as local midnight instead, so formatting it back never shifts a day off in
	// timezones behind UTC (the same class of bug already hit once with generatedWorkoutAt).
	function localDate(dateKey) {
		return new Date(`${dateKey}T00:00:00`);
	}

	// First column of each new month gets a label, so the grid reads like a real calendar.
	const heatmapMonthLabels = $derived(
		adherenceHeatmap.map((week, i) => {
			const month = localDate(week[0].date).toLocaleDateString(i18n.locale, { month: 'short' });
			const prevMonth =
				i > 0
					? localDate(adherenceHeatmap[i - 1][0].date).toLocaleDateString(i18n.locale, {
							month: 'short'
						})
					: null;
			return month !== prevMonth ? month : '';
		})
	);

	let selectedDay = $state(null);
	const selectedDayLabel = $derived(
		selectedDay
			? localDate(selectedDay.date).toLocaleDateString(i18n.locale, {
					weekday: 'long',
					day: 'numeric',
					month: 'long'
				})
			: null
	);

	const todayNutrition = $derived(data.todayNutrition);

	const volumeHistory = $derived(data.volumeHistory ?? []);
	const volumeBars = $derived.by(() => {
		if (volumeHistory.length === 0) return null;
		const max = Math.max(...volumeHistory.map((v) => v.volume), 1);
		return volumeHistory.map((v) => ({
			...v,
			heightPct: Math.max(4, Math.round((v.volume / max) * 100))
		}));
	});
	const latestVolume = $derived(volumeHistory.at(-1)?.volume ?? null);
	const volumeDelta = $derived.by(() => {
		if (volumeHistory.length < 2) return null;
		const prev = volumeHistory.at(-2).volume;
		if (!prev) return null;
		return Math.round(((latestVolume - prev) / prev) * 100);
	});

	const progressHistory = $derived(data.progressHistory ?? []);
	const chartW = 100;
	const chartH = 40;

	const exerciseTrends = $derived(data.exerciseTrends ?? {});
	const exerciseNames = $derived(Object.keys(exerciseTrends));
	let selectedExercise = $state(null);
	const currentExercise = $derived(selectedExercise ?? exerciseNames[0] ?? null);
	const currentTrend = $derived(currentExercise ? (exerciseTrends[currentExercise] ?? []) : []);
	const strengthChartPoints = $derived.by(() => {
		if (currentTrend.length < 2) return null;
		const weights = currentTrend.map((p) => Number(p.weight));
		const min = Math.min(...weights);
		const max = Math.max(...weights);
		const range = max - min || 1;
		const padY = 4;
		return currentTrend.map((p, i) => ({
			x: (i / (currentTrend.length - 1)) * chartW,
			y: chartH - padY - ((Number(p.weight) - min) / range) * (chartH - padY * 2),
			weight: Number(p.weight),
			date: p.date
		}));
	});
	const strengthLinePath = $derived(
		strengthChartPoints ? 'M' + strengthChartPoints.map((p) => `${p.x},${p.y}`).join(' L') : ''
	);
	const strengthAreaPath = $derived(
		strengthChartPoints
			? `${strengthLinePath} L${strengthChartPoints[strengthChartPoints.length - 1].x},${chartH} L0,${chartH} Z`
			: ''
	);
	const strengthDelta = $derived(
		currentTrend.length >= 2
			? Number(currentTrend.at(-1).weight) - Number(currentTrend[0].weight)
			: null
	);
	const strengthLatest = $derived(currentTrend.at(-1)?.weight ?? null);

	const chartPoints = $derived.by(() => {
		if (progressHistory.length < 2) return null;
		const weights = progressHistory.map((p) => Number(p.weight));
		const min = Math.min(...weights);
		const max = Math.max(...weights);
		const range = max - min || 1;
		const padY = 4;
		return progressHistory.map((p, i) => ({
			x: (i / (progressHistory.length - 1)) * chartW,
			y: chartH - padY - ((Number(p.weight) - min) / range) * (chartH - padY * 2),
			weight: Number(p.weight),
			date: p.createdAt
		}));
	});
	const linePath = $derived(
		chartPoints ? 'M' + chartPoints.map((p) => `${p.x},${p.y}`).join(' L') : ''
	);
	const areaPath = $derived(
		chartPoints
			? `${linePath} L${chartPoints[chartPoints.length - 1].x},${chartH} L0,${chartH} Z`
			: ''
	);
	const latestWeight = $derived(progressHistory.at(-1)?.weight ?? null);
	const firstWeight = $derived(progressHistory.at(0)?.weight ?? null);
	const weightDelta = $derived(
		latestWeight !== null && firstWeight !== null
			? Number(latestWeight) - Number(firstWeight)
			: null
	);
	const weightTrendClass = $derived.by(() => {
		if (weightDelta === null || weightDelta === 0) return '';
		const losingWeight = weightDelta < 0;
		if (profile?.goal === 'Weight Loss') return losingWeight ? 'good' : 'bad';
		if (profile?.goal === 'Muscle Gain') return losingWeight ? 'bad' : 'good';
		return 'neutral';
	});

	let bmi = $state(null);
	let bmiCategoryKey = $state('');
	let calories = $state(null);
	let calculatedCalories = $state(null);
	let protein = $state(null);
	let carbs = $state(null);
	let fats = $state(null);
	let nutritionMessage = $state('');
	let weightTrendNote = $state('');

	let activeDay = $state(0);
	let showExplanation = $state(false);

	const days = workout.filter((w) => w.day !== '-');
	const tip = workout.find((w) => w.day === '-');

	if (profile) {
		bmi = (Number(profile.weight) / Math.pow(Number(profile.height) / 100, 2)).toFixed(1);
		if (bmi < 18.5) bmiCategoryKey = 'underweight';
		else if (bmi < 25) bmiCategoryKey = 'normal';
		else if (bmi < 30) bmiCategoryKey = 'overweight';
		else bmiCategoryKey = 'obese';

		const targets = computeNutritionTargets(profile);
		calories = targets.calories;
		calculatedCalories = targets.calculatedCalories;
		protein = targets.protein;
		carbs = targets.carbs;
		fats = targets.fats;

		if (profile.goal === 'Weight Loss') {
			nutritionMessage = t('dashboard.nutritionWeightLoss');
		}

		if (profile.goal === 'Muscle Gain') {
			nutritionMessage = t('dashboard.nutritionMuscleGain');
		}

		if (profile.goal === 'Strength Building') {
			nutritionMessage = t('dashboard.nutritionStrengthBuilding');
		}

		if (profile.goal === 'General Fitness') {
			nutritionMessage = t('dashboard.nutritionGeneralFitness');
		}

		// Compare their actual logged weigh-ins against the trend this calorie target implies,
		// so the nutrition panel reflects real data instead of only the static formula.
		const history = data.progressHistory ?? [];
		if (history.length >= 2) {
			const first = history[0];
			const last = history[history.length - 1];
			const daysElapsed = (new Date(last.createdAt) - new Date(first.createdAt)) / 86400000;

			if (daysElapsed >= 10) {
				const weeksElapsed = daysElapsed / 7;
				const actualWeeklyRate = (Number(last.weight) - Number(first.weight)) / weeksElapsed;
				const expectedWeeklyRate =
					{
						'Weight Loss': -0.45,
						'Muscle Gain': 0.27,
						'Strength Building': 0.18,
						'General Fitness': 0
					}[profile.goal] ?? 0;

				if (profile.goal === 'General Fitness') {
					if (Math.abs(actualWeeklyRate) >= 0.3) {
						weightTrendNote = `Your logged weight is trending ${actualWeeklyRate > 0 ? 'up' : 'down'} ~${Math.abs(actualWeeklyRate).toFixed(1)}kg/week — worth checking that's what you want.`;
					}
				} else {
					const sameDirection =
						Math.sign(actualWeeklyRate) === Math.sign(expectedWeeklyRate) ||
						Math.abs(actualWeeklyRate) < 0.05;

					if (!sameDirection && Math.abs(actualWeeklyRate) >= 0.1) {
						weightTrendNote = `Your logged weight is trending the opposite way from your ${profile.goal} goal — your calorie target above may need adjusting.`;
					} else if (
						sameDirection &&
						Math.abs(actualWeeklyRate) > Math.abs(expectedWeeklyRate) * 1.8
					) {
						weightTrendNote = `You're changing weight faster than this target implies (~${Math.abs(actualWeeklyRate).toFixed(1)}kg/week logged) — your real intake may differ from the estimate.`;
					} else if (
						sameDirection &&
						Math.abs(expectedWeeklyRate) > 0 &&
						Math.abs(actualWeeklyRate) < Math.abs(expectedWeeklyRate) * 0.3
					) {
						weightTrendNote = `Your weight has barely moved despite the ${profile.goal} target — you may be eating closer to maintenance than planned.`;
					} else {
						weightTrendNote = `Your logged weight trend matches your ${profile.goal} target — keep it up.`;
					}
				}
			}
		}
	}

	const equipmentMap = $derived({
		'Full Gym': [
			t('enums.equipmentItems.freeWeights'),
			t('enums.equipmentItems.machines'),
			t('enums.equipmentItems.cableStation'),
			t('enums.equipmentItems.cardioEquipment'),
			t('enums.equipmentItems.otherAccessories')
		],
		'Home Dumbbells': [
			t('enums.equipmentItems.dumbbells'),
			t('enums.equipmentItems.benchOptional'),
			t('enums.equipmentItems.pullUpBarOptional')
		],
		'Resistance Bands': [
			t('enums.equipmentAccess.resistanceBands'),
			t('enums.equipmentItems.anchorPoint')
		],
		'Bodyweight Only': [
			t('enums.equipmentItems.noEquipmentNeeded'),
			t('enums.equipmentItems.justYourBody')
		]
	});

	const equipmentList = $derived(equipmentMap[profile?.equipmentAccess] ?? []);

	const profileRows = $derived(
		profile
			? [
					['calendar', t('dashboard.age'), profile.age],
					['ruler', t('dashboard.height'), Number(profile.height) + ' cm'],
					['scale', t('dashboard.weight'), Number(profile.weight) + ' kg'],
					['user', t('dashboard.gender'), tEnum('gender', profile.gender) || '—'],
					[
						'flame',
						t('dashboard.activityLevel'),
						tEnum('activityLevel', profile.activityLevel) || '—'
					]
				]
			: []
	);
</script>

<svelte:head>
	<title>Dashboard | AI Fitness Coach</title>
</svelte:head>

{#if profile}
	<div class="page motion-in">
		<!-- Header -->
		<header class="header">
			<div class="greeting">
				{#if data.userImage}
					<img class="greeting-avatar" src={data.userImage} alt="" />
				{:else}
					<div class="greeting-avatar greeting-avatar-fallback">
						{firstName[0]?.toUpperCase() ?? '?'}
					</div>
				{/if}
				<div>
					<h1>{t('dashboard.welcomeBack', { name: firstName })}</h1>
					<p>
						{todayLabel} · {lastWorkoutLabel
							? t('dashboard.lastWorkout', { time: lastWorkoutLabel })
							: t('dashboard.noWorkoutsLoggedYet')}
					</p>
				</div>
			</div>
			<div class="actions">
				<Button href="/coach" variant="primary">
					<Icon name="dumbbell" size={15} />
					{t('dashboard.askCoach')}
				</Button>
				<Button href="/workout-log" variant="ghost">
					<Icon name="plus" size={15} />
					{t('dashboard.logWorkout')}
				</Button>
				<Button variant="ghost" onclick={() => window.print()}>
					<Icon name="print" size={15} />
					{t('dashboard.print')}
				</Button>
				<form method="POST" action="?/generate">
					<Button variant="ghost" type="submit">
						<Icon name="target" size={15} />
						{t('dashboard.regeneratePlan')}
					</Button>
				</form>
			</div>
		</header>

		<!-- Stat Cards -->
		<section class="stats">
			<div class="stat-card motion-in" style="--panel-accent: var(--accent-teal)">
				<div class="stat-icon"><Icon name="chart" size={20} /></div>
				<div class="stat-right">
					<div class="stat-label">{t('dashboard.bmi')}</div>
					<div class="stat-value stat-value-gradient">{bmi}</div>
					<span class="pill {bmiCategoryKey}">{t(`enums.bmiCategory.${bmiCategoryKey}`)}</span>
				</div>
			</div>
			<div
				class="stat-card motion-in"
				style="--panel-accent: var(--accent-purple); animation-delay: 60ms"
			>
				<div class="stat-icon"><Icon name="flame" size={20} /></div>
				<div class="stat-right">
					<div class="stat-label">{t('dashboard.calories')}</div>
					<div class="stat-value stat-value-gradient">{calories?.toLocaleString()}</div>
					<div class="stat-sub">{t('dashboard.kcalPerDay')}</div>
				</div>
			</div>
			<div
				class="stat-card motion-in"
				style="--panel-accent: var(--accent-blue); animation-delay: 120ms"
			>
				<div class="stat-icon"><Icon name="dumbbell" size={20} /></div>
				<div class="stat-right">
					<div class="stat-label">{t('dashboard.workoutDays')}</div>
					<div class="stat-value stat-value-gradient">{profile.workoutDays}</div>
					<div class="stat-sub">{t('dashboard.daysPerWeek')}</div>
				</div>
			</div>
			<div
				class="stat-card motion-in"
				style="--panel-accent: var(--accent-volt); animation-delay: 180ms"
			>
				<div class="stat-icon"><Icon name="target" size={20} /></div>
				<div class="stat-right">
					<div class="stat-label">{t('dashboard.goal')}</div>
					<div class="stat-value goal-val">{tEnum('goal', profile.goal)}</div>
					<div class="stat-sub">{tEnum('experience', profile.experience)}</div>
				</div>
			</div>
			<div
				class="stat-card motion-in"
				style="--panel-accent: var(--accent-red); animation-delay: 240ms"
			>
				<div class="stat-icon"><Icon name="flame" size={20} /></div>
				<div class="stat-right">
					<div class="stat-label">{t('dashboard.dayStreak')}</div>
					<div class="stat-value stat-value-gradient">{streak}</div>
					<div class="stat-sub">
						{streak === 1 ? t('dashboard.dayInARow') : t('dashboard.daysInARow')}
					</div>
				</div>
			</div>
		</section>

		<div class="panel heatmap-panel motion-in" style="--panel-accent: var(--accent-green)">
			<div class="panel-head">
				<div class="panel-icon"><Icon name="calendar" size={16} /></div>
				<h2>{t('dashboard.adherenceHeatmap')}</h2>
				<span class="heatmap-sub">{t('dashboard.last12Weeks')}</span>
			</div>

			<div class="heatmap-headline">
				<div class="heatmap-stat">
					<span class="heatmap-count">{heatmapSessionCount}</span>
					<span class="heatmap-count-label">{t('dashboard.sessionsIn12Weeks')}</span>
				</div>
				<div class="heatmap-stat">
					<span class="heatmap-count">{streak}</span>
					<span class="heatmap-count-label"
						>{streak === 1 ? t('dashboard.dayInARow') : t('dashboard.daysInARow')}</span
					>
				</div>
			</div>

			<div class="heatmap-body">
				<div class="heatmap-daylabels">
					{#each weekDayLabels as label, i (i)}
						<span>{i % 2 === 1 ? label : ''}</span>
					{/each}
				</div>
				<div class="heatmap-scroll">
					<div class="heatmap-months">
						{#each heatmapMonthLabels as label, i (i)}
							<span>{label}</span>
						{/each}
					</div>
					<div class="heatmap-grid">
						{#each adherenceHeatmap as week, wi (wi)}
							<div class="heatmap-col">
								{#each week as day (day.date)}
									<button
										type="button"
										class="heatmap-cell tier-{heatmapTier(day)} {day.isFuture
											? 'future'
											: ''} {selectedDay?.date === day.date ? 'selected' : ''}"
										disabled={day.isFuture}
										title="{day.date}{day.done ? ` · ${day.volume.toLocaleString()} kg` : ''}"
										onclick={() => (selectedDay = day)}
										aria-label={day.date}
									></button>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>

			{#if selectedDay}
				<div class="heatmap-detail">
					<div>
						<strong>{selectedDayLabel}</strong>
						<p>
							{selectedDay.done
								? t('dashboard.heatmapVolumeLogged', {
										n: selectedDay.volume.toLocaleString()
									})
								: t('dashboard.heatmapNoSession')}
						</p>
					</div>
					{#if selectedDay.done}
						<a href={resolve('/history')} class="panel-link">{t('dashboard.viewInHistory')}</a>
					{/if}
				</div>
			{/if}

			<div class="heatmap-legend">
				<span>{t('dashboard.less')}</span>
				<span class="heatmap-cell tier-0"></span>
				<span class="heatmap-cell tier-1"></span>
				<span class="heatmap-cell tier-2"></span>
				<span class="heatmap-cell tier-3"></span>
				<span>{t('dashboard.more')}</span>
			</div>
		</div>

		<div class="panel nutrition-panel motion-in" style="--panel-accent: var(--accent-purple)">
			<div class="panel-head panel-head-row">
				<div class="panel-head-left">
					<div class="panel-icon"><Icon name="flame" size={16} /></div>
					<h2>{t('dashboard.dailyNutrition')}</h2>
					{#if profile.customCalorieTarget}
						<span class="custom-badge">{t('dashboard.customTarget')}</span>
					{/if}
				</div>
				<a href={resolve('/nutrition')} class="panel-link">{t('dashboard.logFood')}</a>
			</div>

			<div class="nutrition-grid">
				<StatTile value={calories} label={t('dashboard.calories')} />
				<StatTile value="{protein}g" label={t('dashboard.protein')} />
				<StatTile value="{carbs}g" label={t('dashboard.carbohydrates')} />
				<StatTile value="{fats}g" label={t('dashboard.fats')} />
			</div>

			<p class="nutrition-tip">{nutritionMessage}</p>
			{#if profile.customCalorieTarget && calculatedCalories}
				<p class="nutrition-trend">
					<Icon name="target" size={13} />
					{t('dashboard.calculatedWouldBe', { n: calculatedCalories.toLocaleString() })}
				</p>
			{/if}
			{#if weightTrendNote}
				<p class="nutrition-trend"><Icon name="chart" size={13} /> {weightTrendNote}</p>
			{/if}
			{#if todayNutrition}
				<div class="today-log">
					<span
						>{t('dashboard.loggedToday', {
							cal: todayNutrition.calories.toLocaleString(),
							target: calories?.toLocaleString() ?? '—'
						})}</span
					>
					<div class="today-log-bar">
						<div
							class="today-log-fill"
							style="width: {Math.min(
								100,
								Math.round((todayNutrition.calories / (calories || 1)) * 100)
							)}%"
						></div>
					</div>
				</div>
			{/if}
		</div>

		<div class="panel weight-panel motion-in" style="--panel-accent: var(--accent-teal)">
			<div class="panel-head">
				<div class="panel-icon"><Icon name="chart" size={16} /></div>
				<h2>{t('dashboard.weightProgress')}</h2>
			</div>

			<div class="weight-body">
				<div class="weight-chart-wrap">
					{#if chartPoints}
						<svg class="weight-chart" viewBox="0 0 {chartW} {chartH}" preserveAspectRatio="none">
							<defs>
								<linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="var(--accent-teal)" stop-opacity="0.35" />
									<stop offset="100%" stop-color="var(--accent-teal)" stop-opacity="0" />
								</linearGradient>
							</defs>
							<path d={areaPath} fill="url(#weightFill)" />
							<path d={linePath} fill="none" stroke="var(--accent-teal)" stroke-width="1.5" />
						</svg>
						<div class="weight-meta">
							<div>
								<span class="weight-latest">{latestWeight} kg</span>
								{#if weightDelta !== null && weightDelta !== 0}
									<span class="weight-delta {weightTrendClass}">
										{weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg {t(
											'dashboard.sinceFirstLog'
										)}
									</span>
								{/if}
							</div>
							<span class="weight-count"
								>{t('dashboard.entriesLogged', { count: progressHistory.length })}</span
							>
						</div>
					{:else}
						<p class="weight-empty">
							{t('dashboard.weightEmpty')}
						</p>
					{/if}
				</div>

				<form method="POST" action="?/logWeight" class="weight-form">
					<input
						type="number"
						name="weight"
						step="0.1"
						min="0"
						placeholder={t('dashboard.weightPlaceholder')}
						required
					/>
					<Button type="submit" variant="primary" size="sm">{t('dashboard.logButton')}</Button>
				</form>
				{#if form?.weightError}
					<p class="weight-status weight-error">
						<Icon name="alert" size={12} />
						{form.weightError}
					</p>
				{:else if form?.weightSuccess}
					<p class="weight-status weight-success">
						<Icon name="check" size={12} />
						{t('dashboard.weightLogged')}
					</p>
				{/if}
			</div>
		</div>

		{#if volumeBars}
			<div class="panel volume-panel motion-in" style="--panel-accent: var(--accent-purple)">
				<div class="panel-head">
					<div class="panel-icon"><Icon name="dumbbell" size={16} /></div>
					<h2>{t('dashboard.trainingVolume')}</h2>
				</div>

				<div class="volume-body">
					<div class="volume-meta">
						<span class="volume-latest">{Math.round(latestVolume).toLocaleString()} kg</span>
						{#if volumeDelta !== null}
							<span class="volume-delta {volumeDelta >= 0 ? 'up' : 'down'}">
								{volumeDelta >= 0 ? '+' : ''}{volumeDelta}% {t('dashboard.vsPreviousSession')}
							</span>
						{/if}
					</div>
					<div class="volume-bars">
						{#each volumeBars as bar (bar.date)}
							<div class="volume-bar-wrap" title="{Math.round(bar.volume).toLocaleString()} kg">
								<div class="volume-bar" style="height: {bar.heightPct}%"></div>
								<span class="volume-bar-label"
									>{new Date(bar.date).toLocaleDateString(i18n.locale, {
										day: 'numeric',
										month: 'short'
									})}</span
								>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		{#if exerciseNames.length > 0}
			<div class="panel strength-panel motion-in" style="--panel-accent: var(--accent-blue)">
				<div class="panel-head panel-head-row">
					<div class="panel-head-left">
						<div class="panel-icon"><Icon name="chart" size={16} /></div>
						<h2>{t('dashboard.strengthProgression')}</h2>
					</div>
					<select class="exercise-select" bind:value={selectedExercise}>
						{#each exerciseNames as name (name)}
							<option value={name}>{name}</option>
						{/each}
					</select>
				</div>

				<div class="strength-body">
					{#if strengthChartPoints}
						<svg class="strength-chart" viewBox="0 0 {chartW} {chartH}" preserveAspectRatio="none">
							<defs>
								<linearGradient id="strengthFill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="var(--accent-blue)" stop-opacity="0.35" />
									<stop offset="100%" stop-color="var(--accent-blue)" stop-opacity="0" />
								</linearGradient>
							</defs>
							<path d={strengthAreaPath} fill="url(#strengthFill)" />
							<path
								d={strengthLinePath}
								fill="none"
								stroke="var(--accent-blue)"
								stroke-width="1.5"
							/>
						</svg>
						<div class="weight-meta">
							<div>
								<span class="weight-latest">{strengthLatest} kg</span>
								{#if strengthDelta !== null && strengthDelta !== 0}
									<span class="weight-delta {strengthDelta > 0 ? 'good' : 'bad'}">
										{strengthDelta > 0 ? '+' : ''}{strengthDelta.toFixed(1)} kg
									</span>
								{/if}
							</div>
							<span class="weight-count">{currentTrend.length} {t('dashboard.sessionsLogged')}</span
							>
						</div>
					{:else}
						<p class="weight-empty">{t('dashboard.strengthEmpty')}</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Main Grid -->
		<div class="main-grid">
			<!-- Left: Profile + Injuries -->
			<div class="left-col">
				<div class="panel motion-in" style="--panel-accent: var(--accent-blue)">
					<div class="panel-head">
						<div class="panel-icon"><Icon name="user" size={16} /></div>
						<h2>{t('dashboard.profileDetails')}</h2>
					</div>
					<div class="profile-rows">
						{#each profileRows as [icon, label, val] (label)}
							<div class="profile-row">
								<span class="row-icon"><Icon name={icon} size={14} /></span>
								<span class="row-label">{label}</span>
								<span class="row-val">{val}</span>
							</div>
						{/each}
					</div>
				</div>

				<div
					class="panel injuries-panel motion-in"
					style="--panel-accent: {profile.injuries
						? 'var(--accent-red)'
						: 'var(--accent-green)'}; animation-delay: 60ms"
				>
					<div class="panel-head">
						<div class="panel-icon"><Icon name="alert" size={16} /></div>
						<h2>{t('dashboard.injuries')}</h2>
					</div>
					{#if profile.injuries}
						<p class="injury-text">{profile.injuries}</p>
					{:else}
						<div class="no-injury">
							<Icon name="check" size={24} />
							<div>
								<p class="no-injury-title">{t('dashboard.noInjuriesReported')}</p>
								<p class="no-injury-sub">{t('dashboard.allGoodToGo')}</p>
							</div>
						</div>
					{/if}
				</div>

				<div
					class="panel equipment-panel motion-in"
					style="--panel-accent: var(--accent-teal); animation-delay: 120ms"
				>
					<div class="panel-head">
						<div class="panel-icon"><Icon name="shield" size={16} /></div>
						<h2>{t('dashboard.equipment')}</h2>
					</div>
					<div class="equip-badge">{tEnum('equipmentAccess', profile.equipmentAccess) || '—'}</div>
					<p class="equip-sub">{t('dashboard.youHaveAccessTo')}</p>
					<ul class="equip-list">
						{#each equipmentList as item (item)}
							<li><Icon name="check" size={13} /> {item}</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Centre: Workout Plan -->
			<div class="centre-col">
				<div class="panel workout-panel motion-in" style="--panel-accent: var(--accent-purple)">
					<div class="panel-head">
						<div class="panel-icon"><Icon name="dumbbell" size={16} /></div>
						<h2>{t('dashboard.personalWorkoutPlan')}</h2>
					</div>

					{#if planIsStale}
						<form method="POST" action="?/generate" class="stale-banner">
							<Icon name="alert" size={15} />
							<span>{t('dashboard.stalePlanNotice')}</span>
							<Button type="submit" variant="ghost" size="sm">{t('dashboard.regenerate')}</Button>
						</form>
					{/if}

					<!-- Day tabs -->
					<div class="day-tabs">
						{#each days as w, i (w.day)}
							<button
								class="day-tab {activeDay === i ? 'active' : ''}"
								onclick={() => {
									activeDay = i;
									showExplanation = false;
								}}
							>
								<span class="tab-num">{w.day}</span>
								<span class="tab-label">{w.title}</span>
							</button>
						{/each}
					</div>

					<!-- Active day -->
					{#if days[activeDay]}
						<div class="day-card">
							<div class="day-card-header">
								<div>
									<span class="day-badge"
										>{t('dashboard.dayBadge', { n: days[activeDay].day })}</span
									>
									<h3>{days[activeDay].title}</h3>
									<button class="explain-btn" onclick={() => (showExplanation = !showExplanation)}>
										<Icon name="chart" size={14} />
										{showExplanation ? t('dashboard.hideWorkout') : t('dashboard.explainWorkout')}
									</button>

									{#if showExplanation}
										<div class="explanation-box">
											<p>{days[activeDay].notes}</p>
											{#if days[activeDay].cardio}
												<div class="explanation-cardio">
													<Icon name="flame" size={12} />
													{t('dashboard.includes')}
													{days[activeDay].cardio}
												</div>
											{/if}
										</div>
									{/if}
								</div>
							</div>
							<div class="exercise-list">
								{#each days[activeDay].exercises as ex (ex.name)}
									<div class="exercise-row">
										<Icon name="check" size={16} />
										<span class="ex-name">{ex.name}</span>
										<span class="ex-sets">{ex.sets} × {ex.reps}</span>
									</div>
								{/each}
							</div>
							{#if tip}
								<div class="tip-box">
									<Icon name="alert" size={15} />
									<span><strong>{t('dashboard.tip')}</strong> {tip.exercises[0].name}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Right: Quick actions + activity -->
			<div class="right-col">
				<div class="panel change-panel motion-in">
					<div class="change-icon"><Icon name="target" size={18} /></div>
					<h3>{t('dashboard.needAChange')}</h3>
					<p>{t('dashboard.updateProfileHint')}</p>
					<Button href="/profile" variant="primary" full>
						<Icon name="edit" size={14} />
						{t('dashboard.editProfile')}
					</Button>
				</div>
				<div
					class="panel motion-in"
					style="--panel-accent: var(--accent-blue); animation-delay: 60ms"
				>
					<div class="panel-head panel-head-row">
						<div class="panel-head-left">
							<div class="panel-icon"><Icon name="clock" size={16} /></div>
							<h2>{t('dashboard.recentWorkoutLogs')}</h2>
						</div>
						<a href={resolve('/history')} class="panel-link">{t('dashboard.viewAll')}</a>
					</div>

					{#if !data.logs?.length}
						<p class="empty">{t('dashboard.noLogsYet')}</p>
					{:else}
						<div class="log-list">
							{#each data.logs as log (log.id)}
								<div class="log-card">
									<span class="log-dot"></span>
									<div>
										<strong>{log.exercise}</strong>
										<p>
											{t('dashboard.logLine', {
												set: log.setNumber,
												weight: Number(log.weight),
												reps: log.reps
											})}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="empty-page">
		<div class="empty-card">
			<div class="empty-icon"><Icon name="dumbbell" size={28} /></div>
			<h2>{t('dashboard.noProfileFound')}</h2>
			<p>{t('dashboard.createProfileToStart')}</p>
			<Button href="/profile" variant="primary">{t('dashboard.createProfile')}</Button>
		</div>
	</div>
{/if}

<style>
	.page {
		max-width: 1300px;
		margin: 0 auto;
		padding: 2rem 1.5rem 3rem;
	}

	/* Header */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.8rem;
	}
	.header h1 {
		font-family: var(--font-display);
		font-size: 1.9rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.5px;
	}
	.header p {
		margin: 0.2rem 0 0;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
	.greeting {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}
	.greeting-avatar {
		width: 48px;
		height: 48px;
		border-radius: 999px;
		object-fit: cover;
		flex-shrink: 0;
	}
	.greeting-avatar-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-accent);
		color: white;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.1rem;
	}
	.actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	/* Stat cards */
	.stats {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.stat-card {
		position: relative;
		background: var(--bg-panel);
		border-radius: var(--radius-lg);
		padding: 1.2rem 1.4rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid var(--border-subtle);
		overflow: hidden;
		transition:
			transform var(--motion-base) var(--ease-out),
			border-color var(--motion-base) ease,
			box-shadow var(--motion-base) var(--ease-out);
	}
	.stat-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		height: 3px;
		background: var(--panel-accent, var(--accent-blue));
	}
	.stat-card:hover {
		transform: translateY(-3px);
		border-color: color-mix(
			in srgb,
			var(--panel-accent, var(--accent-blue)) 45%,
			var(--border-subtle)
		);
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
	}
	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: color-mix(in srgb, var(--panel-accent, var(--accent-blue)) 16%, transparent);
		color: var(--panel-accent, var(--accent-blue));
	}
	.stat-label {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-faint);
		font-weight: 600;
	}
	.stat-value {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 700;
		line-height: 1.1;
	}
	.stat-value-gradient {
		background: var(--gradient-accent);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.goal-val {
		font-size: 1rem;
		line-height: 1.3;
	}
	.stat-sub {
		font-size: 0.78rem;
		color: var(--text-faint);
		margin-top: 0.1rem;
	}
	.pill {
		display: inline-block;
		padding: 0.15rem 0.6rem;
		border-radius: 20px;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		margin-top: 0.2rem;
	}
	.pill.normal {
		background: rgba(34, 197, 94, 0.15);
		color: var(--accent-green);
	}
	.pill.underweight {
		background: rgba(251, 146, 60, 0.15);
		color: #fb923c;
	}
	.pill.overweight {
		background: rgba(250, 204, 21, 0.15);
		color: #facc15;
	}
	.pill.obese {
		background: rgba(244, 63, 94, 0.15);
		color: var(--accent-red);
	}

	/* Main grid */
	.main-grid {
		display: grid;
		grid-template-columns: 280px 1fr 260px;
		gap: 1.2rem;
		align-items: start;
	}
	.left-col,
	.right-col {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	/* Panels */
	.panel {
		position: relative;
		background: var(--bg-panel);
		border-radius: var(--radius-lg);
		padding: 1.4rem;
		border: 1px solid var(--border-subtle);
		overflow: hidden;
		transition:
			transform var(--motion-base) var(--ease-out),
			border-color var(--motion-base) ease,
			box-shadow var(--motion-base) var(--ease-out);
	}
	.panel::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		height: 3px;
		background: var(--panel-accent, var(--accent-blue));
		opacity: 0.85;
	}
	.panel:hover {
		transform: translateY(-3px);
		border-color: color-mix(
			in srgb,
			var(--panel-accent, var(--accent-blue)) 40%,
			var(--border-subtle)
		);
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3);
	}
	.panel-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1.2rem;
	}
	.panel-head h2 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.panel-head-row {
		justify-content: space-between;
	}
	.panel-head-left {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.panel-link {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--accent-blue);
		text-decoration: none;
	}
	.panel-link:hover {
		text-decoration: underline;
	}
	.panel-icon {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: color-mix(in srgb, var(--panel-accent, var(--accent-blue)) 16%, transparent);
		color: var(--panel-accent, var(--accent-blue));
	}

	/* Profile rows */
	.profile-rows {
		display: flex;
		flex-direction: column;
	}
	.profile-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--border-subtle);
		font-size: 0.88rem;
	}
	.profile-row:last-child {
		border-bottom: none;
	}
	.row-icon {
		width: 20px;
		display: flex;
		justify-content: center;
		color: var(--text-faint);
	}
	.row-label {
		color: var(--text-muted);
		flex: 1;
	}
	.row-val {
		font-weight: 600;
	}

	/* Injuries */
	.no-injury {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.25);
		border-radius: var(--radius-md);
		padding: 0.9rem 1rem;
		color: var(--accent-green);
	}
	.no-injury-title {
		font-weight: 700;
		color: var(--accent-green);
		margin: 0;
		font-size: 0.88rem;
	}
	.no-injury-sub {
		color: color-mix(in srgb, var(--accent-green) 70%, white);
		margin: 0;
		font-size: 0.78rem;
	}
	.injury-text {
		color: var(--text-primary);
		font-size: 0.88rem;
		line-height: 1.6;
		margin: 0;
	}

	/* Workout panel */
	.day-tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.2rem;
	}
	.day-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 0.9rem;
		border-radius: 10px;
		border: 1px solid var(--border-strong);
		background: var(--bg-input);
		color: var(--text-primary);
		cursor: pointer;
		transition: 0.2s;
		min-width: 56px;
		font-family: var(--font-sans);
	}
	.day-tab:hover {
		border-color: var(--accent-blue);
	}
	.day-tab.active {
		background: var(--gradient-accent);
		border-color: transparent;
	}
	.tab-num {
		font-size: 1rem;
		font-weight: 800;
		line-height: 1;
	}
	.tab-label {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-top: 2px;
	}
	.day-card {
		background: var(--bg-panel-soft);
		border-radius: var(--radius-md);
		padding: 1.2rem;
		border: 1px solid var(--border-subtle);
	}
	.day-card-header {
		margin-bottom: 1rem;
	}
	.day-badge {
		display: inline-block;
		background: var(--gradient-accent);
		color: white;
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.2rem 0.7rem;
		border-radius: 20px;
		margin-bottom: 0.4rem;
	}
	.day-card h3 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 800;
	}
	.exercise-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.exercise-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--bg-panel);
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 1px solid var(--border-subtle);
		font-size: 0.9rem;
		color: var(--accent-blue);
		transition: 0.2s;
	}
	.exercise-row:hover {
		border-color: var(--accent-blue);
		transform: translateX(4px);
	}
	.ex-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
		flex: 1;
	}
	.ex-sets {
		font-weight: 700;
		color: var(--accent-blue);
		font-size: 0.85rem;
		white-space: nowrap;
	}
	.stale-banner {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1.2rem;
		background: rgba(250, 204, 21, 0.1);
		border: 1px solid rgba(250, 204, 21, 0.3);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		color: #facc15;
	}
	.stale-banner span {
		flex: 1;
		font-size: 0.85rem;
		line-height: 1.4;
	}
	.tip-box {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 1rem;
		background: rgba(124, 58, 237, 0.1);
		border: 1px solid rgba(124, 58, 237, 0.3);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		font-size: 0.85rem;
		color: #ddd6fe;
	}

	/* Equipment */
	.equip-badge {
		display: inline-block;
		background: rgba(34, 197, 94, 0.12);
		color: var(--accent-green);
		font-weight: 700;
		font-size: 0.95rem;
		padding: 0.4rem 1rem;
		border-radius: 10px;
		border: 1px solid rgba(34, 197, 94, 0.3);
		margin-bottom: 0.8rem;
	}
	.equip-sub {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 0 0 0.8rem;
	}
	.equip-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.equip-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.88rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	.equip-list :global(svg) {
		color: var(--accent-green);
		flex-shrink: 0;
	}

	/* Change panel */
	.change-panel {
		text-align: center;
	}
	.change-icon {
		width: 40px;
		height: 40px;
		background: rgba(124, 58, 237, 0.12);
		color: var(--accent-blue);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 0.75rem;
	}
	.change-panel h3 {
		font-size: 0.95rem;
		font-weight: 700;
		margin: 0 0 0.3rem;
	}
	.change-panel p {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 0 0 1rem;
	}

	/* Empty */
	.empty-page {
		min-height: calc(100vh - 65px);
		display: flex;
		align-items: center;
		justify-content: center;
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
	.empty-card h2 {
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.empty-card p {
		color: var(--text-muted);
		margin-bottom: 1.5rem;
	}

	.nutrition-panel {
		margin-bottom: 1.5rem;
	}
	.nutrition-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}
	.nutrition-tip {
		margin-top: 1rem;
		padding: 1rem;
		background: rgba(124, 58, 237, 0.1);
		border-left: 4px solid var(--accent-blue);
		border-radius: 12px;
		color: #ddd6fe;
		font-weight: 600;
	}
	.nutrition-trend {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0.6rem 0 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.weight-panel {
		margin-bottom: 1.5rem;
	}
	.weight-body {
		display: flex;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}
	.weight-chart-wrap {
		flex: 1;
		min-width: 220px;
	}
	.weight-chart {
		width: 100%;
		height: 90px;
		display: block;
	}
	.weight-meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-top: 0.6rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.weight-latest {
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 700;
		margin-right: 0.6rem;
	}
	.weight-delta {
		font-size: 0.8rem;
		font-weight: 600;
	}
	.weight-delta.good {
		color: var(--accent-green);
	}
	.weight-delta.bad {
		color: var(--accent-red);
	}
	.weight-delta.neutral {
		color: var(--text-muted);
	}
	.weight-count {
		font-size: 0.78rem;
		color: var(--text-faint);
	}
	.weight-empty {
		color: var(--text-faint);
		font-size: 0.88rem;
		margin: 0;
	}
	.weight-form {
		display: flex;
		gap: 0.6rem;
		flex-shrink: 0;
	}
	.weight-form input {
		width: 180px;
		padding: 0.7rem 0.9rem;
		border-radius: var(--radius-sm);
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		outline: none;
		transition: 0.2s;
	}
	.weight-form input:focus {
		border-color: var(--accent-teal);
		box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.15);
	}
	.weight-status {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		width: 100%;
		margin: 0.6rem 0 0;
		font-size: 0.8rem;
	}
	.weight-error {
		color: var(--accent-red);
	}
	.weight-success {
		color: var(--accent-green);
	}

	/* Adherence heatmap */
	.heatmap-panel {
		margin-bottom: 1.5rem;
	}
	.heatmap-sub {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--text-faint);
		font-weight: 600;
	}
	.heatmap-headline {
		display: flex;
		gap: 2.5rem;
		margin-bottom: 1.6rem;
	}
	.heatmap-stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.heatmap-count {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.1;
		background: var(--gradient-accent);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.heatmap-count-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
	}
	.heatmap-body {
		display: flex;
		gap: 0.8rem;
	}
	.heatmap-daylabels {
		display: flex;
		flex-direction: column;
		gap: 7px;
		flex-shrink: 0;
		padding-top: 27px;
	}
	.heatmap-daylabels span {
		height: 28px;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-faint);
		line-height: 28px;
	}
	.heatmap-scroll {
		flex: 1;
		min-width: 0;
		overflow-x: auto;
		padding-bottom: 0.3rem;
	}
	.heatmap-months {
		display: flex;
		gap: 7px;
		justify-content: center;
		margin-bottom: 6px;
	}
	.heatmap-months span {
		width: 28px;
		flex-shrink: 0;
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-faint);
		white-space: nowrap;
	}
	.heatmap-grid {
		display: flex;
		gap: 7px;
		justify-content: center;
	}
	.heatmap-col {
		display: flex;
		flex-direction: column;
		gap: 7px;
		flex-shrink: 0;
	}
	.heatmap-cell {
		all: unset;
		box-sizing: border-box;
		display: block;
		width: 28px;
		height: 28px;
		border-radius: 7px;
		background: var(--bg-input);
		border: 1px solid var(--border-subtle);
		cursor: pointer;
		transition:
			transform var(--motion-fast) var(--ease-spring),
			box-shadow var(--motion-fast) ease;
	}
	.heatmap-cell:disabled {
		cursor: default;
	}
	.heatmap-cell:not(:disabled):hover {
		transform: scale(1.15);
		box-shadow: 0 0 0 1px var(--text-faint);
	}
	.heatmap-cell.selected {
		box-shadow: 0 0 0 2px var(--accent-volt);
	}
	.heatmap-cell.tier-1 {
		background: color-mix(in srgb, var(--accent-green) 35%, var(--bg-input));
		border-color: transparent;
	}
	.heatmap-cell.tier-2 {
		background: color-mix(in srgb, var(--accent-green) 70%, var(--accent-volt) 10%);
		border-color: transparent;
	}
	.heatmap-cell.tier-3 {
		background: var(--gradient-volt);
		border-color: transparent;
		box-shadow: 0 0 12px rgba(215, 255, 61, 0.45);
	}
	.heatmap-cell.tier-3.selected {
		box-shadow:
			0 0 12px rgba(215, 255, 61, 0.45),
			0 0 0 2px var(--accent-volt);
	}
	.heatmap-cell.future {
		opacity: 0.35;
	}
	.heatmap-detail {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.2rem;
		padding: 0.9rem 1.1rem;
		background: var(--bg-panel-soft);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
	}
	.heatmap-detail strong {
		font-size: 0.88rem;
	}
	.heatmap-detail p {
		margin: 0.15rem 0 0;
		font-size: 0.8rem;
		color: var(--text-faint);
	}
	.heatmap-legend {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		margin-top: 1.2rem;
		font-size: 0.75rem;
		color: var(--text-faint);
	}
	.heatmap-legend .heatmap-cell {
		width: 16px;
		height: 16px;
		cursor: default;
	}

	/* Strength progression */
	.strength-panel {
		margin-bottom: 1.5rem;
	}
	.exercise-select {
		padding: 0.4rem 0.7rem;
		border-radius: var(--radius-sm);
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		outline: none;
	}
	.strength-chart {
		width: 100%;
		height: 90px;
		display: block;
	}
	.strength-body {
		display: flex;
		flex-direction: column;
	}

	/* Custom calorie target / today's log */
	.custom-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: rgba(124, 58, 237, 0.15);
		color: var(--accent-blue);
	}
	.today-log {
		margin-top: 0.8rem;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.today-log-bar {
		margin-top: 0.4rem;
		height: 6px;
		border-radius: 999px;
		background: var(--bg-input);
		overflow: hidden;
	}
	.today-log-fill {
		height: 100%;
		background: var(--gradient-accent);
		border-radius: 999px;
		transition: width var(--motion-base) var(--ease-out);
	}

	/* Training volume */
	.volume-panel {
		margin-bottom: 1.5rem;
	}
	.volume-body {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.volume-meta {
		display: flex;
		align-items: baseline;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.volume-latest {
		font-family: var(--font-display);
		font-size: 1.3rem;
		font-weight: 700;
	}
	.volume-delta {
		font-size: 0.8rem;
		font-weight: 600;
	}
	.volume-delta.up {
		color: var(--accent-green);
	}
	.volume-delta.down {
		color: var(--accent-red);
	}
	.volume-bars {
		display: flex;
		align-items: flex-end;
		gap: 0.6rem;
		height: 120px;
		padding-top: 0.5rem;
	}
	.volume-bar-wrap {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		gap: 0.4rem;
	}
	.volume-bar {
		width: 100%;
		max-width: 32px;
		border-radius: 6px 6px 2px 2px;
		background: var(--gradient-accent);
		transition: height var(--motion-base) var(--ease-out);
	}
	.volume-bar-label {
		font-size: 0.62rem;
		color: var(--text-faint);
		white-space: nowrap;
	}

	.explain-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.8rem;
		padding: 0.6rem 1rem;
		border-radius: 10px;
		border: 1px solid var(--border-strong);
		background: var(--bg-input);
		color: var(--text-primary);
		font-weight: 600;
		font-size: 0.85rem;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: 0.2s;
	}
	.explain-btn:hover {
		border-color: var(--accent-blue);
		color: var(--accent-blue);
	}
	.explanation-box {
		margin-top: 1rem;
		background: rgba(124, 58, 237, 0.1);
		border-left: 4px solid var(--accent-blue);
		padding: 1rem;
		border-radius: 10px;
		color: #ddd6fe;
	}
	.explanation-box p {
		margin: 0;
	}
	.explanation-cardio {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.6rem;
		font-size: 0.82rem;
		color: var(--accent-volt);
	}
	.log-list {
		max-height: 360px;
		overflow-y: auto;
		padding-right: 0.3rem;
		margin-right: -0.3rem;
	}
	.log-list::-webkit-scrollbar {
		width: 6px;
	}
	.log-list::-webkit-scrollbar-thumb {
		background: var(--border-strong);
		border-radius: 999px;
	}
	.log-list::-webkit-scrollbar-thumb:hover {
		background: var(--accent-blue);
	}
	.log-card {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		background: var(--bg-panel-soft);
		padding: 0.8rem 1rem;
		margin-bottom: 0.6rem;
		border-radius: 10px;
		border: 1px solid var(--border-subtle);
		transition: 0.2s;
	}
	.log-dot {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		margin-top: 0.4rem;
		flex-shrink: 0;
		background: var(--gradient-accent);
	}
	.log-card p {
		margin: 0.2rem 0 0;
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.log-card:hover {
		transform: translateX(4px);
		border-color: var(--accent-blue);
	}
	.empty {
		color: var(--text-faint);
		font-style: italic;
		font-size: 0.88rem;
	}

	@media (max-width: 800px) {
		.nutrition-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 1024px) {
		.main-grid {
			grid-template-columns: 1fr 1fr;
		}
		.centre-col {
			grid-column: 1 / -1;
			order: -1;
		}
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 600px) {
		.main-grid {
			grid-template-columns: 1fr;
		}
		.stats {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media print {
		.actions {
			display: none;
		}
	}
</style>
