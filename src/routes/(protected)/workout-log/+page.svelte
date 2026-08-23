<script>
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import SessionCard from '$lib/components/SessionCard.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';

	const i18n = getI18n();
	const t = i18n.t;

	let { data, form } = $props();

	const workoutPlan = data?.workoutPlan ?? [];
	const previousSessions = data?.previousSessions ?? [];
	const lastSessionSets = data?.lastSessionSets ?? {};
	const personalRecords = data?.personalRecords ?? {};
	const exerciseTrends = data?.exerciseTrends ?? {};

	const dayTitles = $derived({
		1: t('workoutLog.dayNames.push'),
		2: t('workoutLog.dayNames.pull'),
		3: t('workoutLog.dayNames.legs'),
		4: t('workoutLog.dayNames.upper'),
		5: t('workoutLog.dayNames.lower'),
		6: t('workoutLog.dayNames.cardio'),
		7: t('workoutLog.dayNames.recovery')
	});
	const setColors = ['#7c3aed', '#ec4899', '#22d3ee'];
	const setLabels = ['1', '2', '3'];

	// Build days from workoutPlan
	function buildDays(plan) {
		const map = {};
		for (const ex of plan) {
			if (!map[ex.day]) map[ex.day] = { day: ex.day, exercises: [] };
			map[ex.day].exercises.push(ex);
		}
		return Object.values(map).sort((a, b) => Number(a.day) - Number(b.day));
	}

	const days = buildDays(workoutPlan);

	let selectedDay = $state(days.length ? days[0].day : null);
	let workout = $state([]);
	let successVisible = $state(false);
	let videoFileName = $state('');

	function loadWorkout(dayNumber) {
		const day = days.find((d) => d.day === dayNumber);
		if (!day) return;

		workout = day.exercises.map((ex) => ({
			name: ex.exercise,
			sets: [
				{ setNumber: 1, weight: 0, reps: 0, done: false },
				{ setNumber: 2, weight: 0, reps: 0, done: false },
				{ setNumber: 3, weight: 0, reps: 0, done: false }
			]
		}));
	}

	function toggleSetDone(i, j) {
		workout = workout.map((e, idx) =>
			idx === i ? { ...e, sets: e.sets.map((s, k) => (k === j ? { ...s, done: !s.done } : s)) } : e
		);
	}

	// Load initial day
	$effect(() => {
		if (selectedDay !== null) loadWorkout(selectedDay);
	});

	// Show success banner when form submits
	$effect(() => {
		if (form?.success) {
			successVisible = true;
			setTimeout(() => (successVisible = false), 7000);
		}
	});

	// Last time's weight/reps for this exact set number, so it can sit beside the input
	function getLastSet(name, setNumber) {
		return lastSessionSets[name]?.find((s) => s.setNumber === setNumber) ?? null;
	}

	// No curated video library here — link out to a live YouTube search instead of
	// guessing a specific video ID, so it always resolves and covers custom exercise names too.
	function formVideoSearchUrl(name) {
		return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form tutorial`)}`;
	}

	// Get history for an exercise from previousSessions
	function getHistory(name) {
		return previousSessions
			.flatMap((s) => {
				const exSets = s.sets?.filter((set) => set.exercise === name) ?? [];
				return exSets;
			})
			.filter((s) => Number(s.weight) > 0)
			.slice(0, 3);
	}

	// Personal records
	function getRecord(name) {
		return personalRecords[name] ?? null;
	}

	// Tiny sparkline path (0-100 x 0-32 viewBox) from a per-exercise trend series
	function buildSparkline(points) {
		if (!points || points.length < 2) return null;
		const weights = points.map((p) => p.weight);
		const min = Math.min(...weights);
		const max = Math.max(...weights);
		const range = max - min || 1;
		const w = 100;
		const h = 32;
		const pad = 3;
		const coords = points.map((p, i) => ({
			x: (i / (points.length - 1)) * w,
			y: h - pad - ((p.weight - min) / range) * (h - pad * 2)
		}));
		const line = 'M' + coords.map((c) => `${c.x},${c.y}`).join(' L');
		const area = `${line} L${coords[coords.length - 1].x},${h} L0,${h} Z`;
		return { line, area, w, h };
	}

	const recordEntries = Object.entries(personalRecords).sort((a, b) => a[0].localeCompare(b[0]));

	// Rest timer
	let restDuration = $state(60);
	let restRemaining = $state(0);
	let restRunning = $state(false);

	function formatTime(s) {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, '0')}`;
	}

	function playRestDoneSound() {
		try {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			const ctx = new Ctx();
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.18, ctx.currentTime);
			gain.connect(ctx.destination);
			for (const delay of [0, 0.22]) {
				const osc = ctx.createOscillator();
				osc.frequency.value = 880;
				osc.connect(gain);
				osc.start(ctx.currentTime + delay);
				osc.stop(ctx.currentTime + delay + 0.16);
			}
		} catch {
			// Audio not available — timer still completes visually.
		}
	}

	function startRest(seconds = restDuration) {
		restDuration = seconds;
		restRemaining = seconds;
		restRunning = true;
	}
	function pauseRest() {
		restRunning = false;
	}
	function resumeRest() {
		if (restRemaining > 0) restRunning = true;
	}
	function resetRest() {
		restRunning = false;
		restRemaining = 0;
	}

	$effect(() => {
		if (!restRunning) return;
		const id = setInterval(() => {
			restRemaining -= 1;
			if (restRemaining <= 0) {
				restRemaining = 0;
				restRunning = false;
				playRestDoneSound();
			}
		}, 1000);
		return () => clearInterval(id);
	});

	// Live summary
	const totalExercises = $derived(workout.length);
	const totalSets = $derived(workout.reduce((t, e) => t + e.sets.length, 0));
	const totalWeight = $derived(
		workout.reduce((t, e) => t + e.sets.reduce((a, s) => a + (parseFloat(s.weight) || 0), 0), 0)
	);
	const totalReps = $derived(
		workout.reduce((t, e) => t + e.sets.reduce((a, s) => a + (parseInt(s.reps) || 0), 0), 0)
	);

	// Serialise workout for the hidden input
	const workoutJson = $derived(
		JSON.stringify(
			workout.map((ex) => ({
				name: ex.name,
				sets: ex.sets.map((s) => ({
					setNumber: s.setNumber,
					weight: parseFloat(s.weight) || 0,
					reps: parseInt(s.reps) || 0
				}))
			}))
		)
	);

	// Mutations
	function addExercise() {
		workout = [
			...workout,
			{
				name: '',
				sets: [
					{ setNumber: 1, weight: '', reps: '', done: false },
					{ setNumber: 2, weight: '', reps: '', done: false },
					{ setNumber: 3, weight: '', reps: '', done: false }
				]
			}
		];
	}

	function removeExercise(i) {
		workout = workout.filter((_, idx) => idx !== i);
	}

	function addSet(i) {
		const ex = workout[i];
		if (!ex || ex.sets.length >= 3) return;
		workout = workout.map((e, idx) =>
			idx === i
				? {
						...e,
						sets: [...e.sets, { setNumber: e.sets.length + 1, weight: '', reps: '', done: false }]
					}
				: e
		);
	}

	function removeSet(i, j) {
		const ex = workout[i];
		if (!ex || ex.sets.length <= 1) return;
		const newSets = ex.sets
			.filter((_, idx) => idx !== j)
			.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
		workout = workout.map((e, idx) => (idx === i ? { ...e, sets: newSets } : e));
	}

	function selectDay(dayNum) {
		if (dayNum !== selectedDay) {
			selectedDay = dayNum;
			loadWorkout(dayNum);
		}
	}
</script>

<svelte:head>
	<title>Workout Logger | AI Fitness Coach</title>
</svelte:head>

<div class="page motion-in">
	<!-- HEADER -->
	<div class="header">
		<div class="header-left">
			<div class="header-icon"><Icon name="dumbbell" size={22} /></div>
			<div>
				<h1>{t('workoutLog.title')}</h1>
				<p class="date">
					{new Date().toLocaleDateString(i18n.locale, {
						weekday: 'long',
						day: 'numeric',
						month: 'long'
					})}
				</p>
			</div>
		</div>
		<Button href="/dashboard" variant="ghost" size="sm">
			<Icon name="chevronLeft" size={14} />
			{t('workoutLog.dashboard')}
		</Button>
	</div>

	{#if data?.needsProfile}
		<div class="notice">
			<Icon name="alert" size={16} />
			{t('workoutLog.needsProfileNotice')}
			<Button href="/profile" variant="primary" size="sm">{t('workoutLog.createProfile')}</Button>
		</div>
	{/if}

	<!-- DAY TABS -->
	<div class="day-section">
		<p class="section-label">{t('workoutLog.selectSession')}</p>
		<div class="day-tabs">
			{#if days.length === 0}
				<p style="color:rgba(255,255,255,0.5)">
					{t('workoutLog.noPlanFound')}
				</p>
			{:else}
				{#each days as d, i (d.day)}
					<button
						class="day-tab {selectedDay === d.day ? 'active' : ''}"
						style="--accent:{setColors[i % 3]}"
						onclick={() => selectDay(d.day)}
					>
						<span class="tab-day">{t('workoutLog.dayLabel', { n: d.day })}</span>
						<span class="tab-name">{dayTitles[d.day] ?? t('workoutLog.sessionFallback')}</span>
						<span class="tab-count"
							>{t('workoutLog.exercisesCount', { n: d.exercises.length })}</span
						>
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- MAIN DASHBOARD -->
	<div class="dashboard">
		<!-- LEFT: form -->
		<div class="left-panel">
			<form method="POST" action="?/save" enctype="multipart/form-data">
				<input type="hidden" name="workout" value={workoutJson} />

				<div class="exercises">
					{#if workout.length === 0}
						<p style="color:rgba(255,255,255,0.4);padding:1rem;text-align:center">
							{t('workoutLog.noExercisesForDay')}
						</p>
					{:else}
						{#each workout as ex, ei (ei)}
							{@const accent = setColors[ei % 3]}
							{@const history = getHistory(ex.name)}
							<div class="ex-card" style="--card-accent:{accent}">
								<div class="ex-header">
									<div class="ex-num">{ei + 1}</div>
									<input
										class="ex-name"
										bind:value={ex.name}
										placeholder={t('workoutLog.exerciseNamePlaceholder')}
										required
									/>
									{#if ex.name}
										<!-- eslint-disable svelte/no-navigation-without-resolve -- external YouTube search, not an app route -->
										<a
											class="ex-watch"
											href={formVideoSearchUrl(ex.name)}
											target="_blank"
											rel="noopener noreferrer"
										>
											<Icon name="play" size={12} />
											{t('workoutLog.watchForm')}
										</a>
										<!-- eslint-enable svelte/no-navigation-without-resolve -->
									{/if}
									<button
										type="button"
										class="ex-remove"
										onclick={() => removeExercise(ei)}
										aria-label={t('workoutLog.removeExerciseAria')}
									>
										<Icon name="close" size={14} />
									</button>
								</div>

								{#if history.length}
									<div class="history">
										<div class="history-label">
											<Icon name="clock" size={12} />
											{t('workoutLog.lastSession')}
										</div>
										<div class="history-rows">
											{#each history as h, hi (h.id)}
												<div class="history-row">
													<span
														class="h-set-badge"
														style="background:{setColors[hi % 3]}22;color:{setColors[hi % 3]}"
														>{setLabels[hi]}</span
													>
													<span class="h-weight"
														>{Number(h.weight)}<span class="h-unit">kg</span></span
													>
													<span class="h-x">×</span>
													<span class="h-reps">{h.reps}<span class="h-unit">reps</span></span>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<div class="sets">
									<div class="sets-header">
										<span>{t('workoutLog.setColumn')}</span>
										<span>{t('workoutLog.weightColumn')}</span>
										<span>{t('workoutLog.repsColumn')}</span>
										<span></span>
										<span></span>
										<span></span>
									</div>
									{#each ex.sets as setRow, si (si)}
										{@const color = setColors[si]}
										{@const last = getLastSet(ex.name, setRow.setNumber)}
										{@const weightNum = parseFloat(setRow.weight) || 0}
										{@const repsNum = parseInt(setRow.reps) || 0}
										{@const weightDelta = last && weightNum > 0 ? weightNum - last.weight : null}
										{@const repsDelta = last && repsNum > 0 ? repsNum - last.reps : null}
										{@const record = getRecord(ex.name)}
										{@const isPR = weightNum > 0 && (!record || weightNum > record.weight)}
										<div class="set-row {setRow.done ? 'done' : ''}">
											<div
												class="set-badge {isPR ? 'pr' : ''}"
												style="background:{color}22;color:{color};border-color:{color}44"
												title={isPR ? t('workoutLog.newPersonalRecordTitle') : undefined}
											>
												{si + 1}
												{#if isPR}
													<span class="pr-flag"><Icon name="award" size={11} /></span>
												{/if}
											</div>
											<div class="set-field">
												<div class="input-shell">
													<input
														type="number"
														step="0.5"
														min="0"
														bind:value={setRow.weight}
														placeholder="0"
														style="--focus-color:{color}"
													/>
													<span class="input-unit">kg</span>
												</div>
												{#if last}
													<div
														class="last-box {weightDelta > 0
															? 'up'
															: weightDelta < 0
																? 'down'
																: ''}"
													>
														<span class="last-box-label">{t('workoutLog.last')}</span>
														<span class="last-box-value"
															>{last.weight}<span class="last-box-unit">kg</span
															>{#if weightDelta}<span class="last-box-arrow"
																	>{weightDelta > 0 ? '↑' : '↓'}</span
																>{/if}</span
														>
													</div>
												{/if}
											</div>
											<div class="set-field">
												<div class="input-shell">
													<input
														type="number"
														min="0"
														bind:value={setRow.reps}
														placeholder="0"
														style="--focus-color:{color}"
													/>
													<span class="input-unit">reps</span>
												</div>
												{#if last}
													<div
														class="last-box {repsDelta > 0 ? 'up' : repsDelta < 0 ? 'down' : ''}"
													>
														<span class="last-box-label">{t('workoutLog.last')}</span>
														<span class="last-box-value"
															>{last.reps}{#if repsDelta}<span class="last-box-arrow"
																	>{repsDelta > 0 ? '↑' : '↓'}</span
																>{/if}</span
														>
													</div>
												{/if}
											</div>
											<button
												type="button"
												class="set-done-btn {setRow.done ? 'done' : ''}"
												onclick={() => toggleSetDone(ei, si)}
												aria-label={setRow.done
													? t('workoutLog.markSetNotDoneAria')
													: t('workoutLog.markSetDoneAria')}
												title={setRow.done
													? t('workoutLog.markNotDoneTitle')
													: t('workoutLog.markDoneTitle')}
											>
												<Icon name="check" size={14} />
											</button>
											<button
												type="button"
												class="set-timer-btn"
												onclick={() => startRest()}
												aria-label={t('workoutLog.startRestTimerAria')}
												title={t('workoutLog.startRestTimerAria')}
											>
												<Icon name="clock" size={13} />
											</button>
											<button
												type="button"
												class="set-remove"
												onclick={() => removeSet(ei, si)}
												disabled={ex.sets.length <= 1}
												aria-label={t('workoutLog.removeSetAria')}
											>
												<Icon name="close" size={12} />
											</button>
										</div>
									{/each}
									{#if ex.sets.length < 3}
										<button type="button" class="add-set" onclick={() => addSet(ei)}
											><Icon name="plus" size={12} /> {t('workoutLog.addSet')}</button
										>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<label class="video-attach" for="video-input">
					<Icon name="video" size={15} />
					<span>
						{videoFileName ? videoFileName : t('workoutLog.attachVideoPlaceholder')}
					</span>
				</label>
				<input
					id="video-input"
					class="video-input"
					type="file"
					name="video"
					accept="video/*"
					onchange={(e) => (videoFileName = e.currentTarget.files?.[0]?.name ?? '')}
				/>

				<div class="bottom-bar">
					<Button type="button" variant="ghost" onclick={addExercise}>
						<Icon name="plus" size={16} />
						{t('workoutLog.addExercise')}
					</Button>
					<Button type="submit" variant="primary" full>{t('workoutLog.saveWorkout')}</Button>
				</div>
			</form>

			{#if successVisible}
				<div class="success-card">
					<div class="success-head">
						<Icon name="check" size={16} />
						{t('workoutLog.workoutSaved')}
					</div>
					{#if form?.insights}
						<div class="success-chips">
							{#each form.insights.newPRs ?? [] as name (name)}
								<span class="success-chip pr">
									<Icon name="award" size={13} />
									{t('workoutLog.newPR', { name })}
								</span>
							{/each}
							{#if form.insights.volumeDeltaPct !== null}
								<span class="success-chip {form.insights.volumeDeltaPct >= 0 ? 'up' : 'down'}">
									<Icon name="chart" size={13} />
									{t('workoutLog.volumeVsLastTime', {
										sign: form.insights.volumeDeltaPct >= 0 ? '+' : '',
										pct: form.insights.volumeDeltaPct
									})}
								</span>
							{/if}
							<span class="success-chip streak">
								<Icon name="flame" size={13} />
								{form.insights.streak === 1
									? t('workoutLog.streakDay', { n: form.insights.streak })
									: t('workoutLog.streakDays', { n: form.insights.streak })}
							</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- RIGHT: summary -->
		<div class="right-panel">
			<div class="summary-card">
				<h3>{t('workoutLog.todaysSummary')}</h3>
				<div class="summary-grid">
					<div class="stat">
						<span class="value">{totalExercises}</span><span class="label"
							>{t('workoutLog.exercises')}</span
						>
					</div>
					<div class="stat">
						<span class="value">{totalSets}</span><span class="label">{t('workoutLog.sets')}</span>
					</div>
					<div class="stat">
						<span class="value">{totalWeight}</span><span class="label"
							>{t('workoutLog.totalKg')}</span
						>
					</div>
					<div class="stat">
						<span class="value">{totalReps}</span><span class="label"
							>{t('workoutLog.totalReps')}</span
						>
					</div>
				</div>
			</div>

			<div class="timer-card">
				<h3><Icon name="clock" size={16} /> {t('workoutLog.restTimer')}</h3>
				<div
					class="timer-display {restRunning ? 'running' : ''} {restRemaining === 0 && !restRunning
						? 'idle'
						: ''}"
				>
					{formatTime(restRemaining || restDuration)}
				</div>
				<div class="timer-presets">
					{#each [30, 60, 90, 120] as s (s)}
						<button
							type="button"
							class="timer-preset {restDuration === s ? 'active' : ''}"
							onclick={() => {
								restDuration = s;
								if (!restRunning) restRemaining = 0;
							}}
						>
							{s}s
						</button>
					{/each}
				</div>
				<div class="timer-controls">
					{#if restRunning}
						<Button type="button" variant="ghost" size="sm" onclick={pauseRest}>
							<Icon name="pause" size={13} />
							{t('workoutLog.pause')}
						</Button>
					{:else if restRemaining > 0}
						<Button type="button" variant="primary" size="sm" onclick={resumeRest}>
							<Icon name="play" size={13} />
							{t('workoutLog.resume')}
						</Button>
					{:else}
						<Button type="button" variant="primary" size="sm" onclick={() => startRest()}>
							<Icon name="play" size={13} />
							{t('workoutLog.start')}
						</Button>
					{/if}
					<Button type="button" variant="ghost" size="sm" onclick={resetRest}
						>{t('workoutLog.reset')}</Button
					>
				</div>
			</div>

			{#if recordEntries.length > 0}
				<div class="records-card">
					<h3><Icon name="award" size={16} /> {t('workoutLog.personalRecords')}</h3>
					<svg width="0" height="0" style="position:absolute">
						<defs>
							<linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="var(--accent-volt)" stop-opacity="0.35" />
								<stop offset="100%" stop-color="var(--accent-volt)" stop-opacity="0" />
							</linearGradient>
						</defs>
					</svg>
					<div class="records-list">
						{#each recordEntries as [name, record] (name)}
							{@const spark = buildSparkline(exerciseTrends[name])}
							<div class="record-row">
								<div class="record-info">
									<strong>{name}</strong>
									<span>{record.weight}kg × {record.reps}</span>
								</div>
								{#if spark}
									<svg
										class="record-spark"
										viewBox="0 0 {spark.w} {spark.h}"
										preserveAspectRatio="none"
									>
										<path d={spark.area} fill="url(#sparkFill)" />
										<path
											d={spark.line}
											fill="none"
											stroke="var(--accent-volt)"
											stroke-width="1.5"
										/>
									</svg>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- WORKOUT HISTORY -->
	<div class="workout-history">
		<div class="workout-history-head">
			<div>
				<h2><Icon name="chart" size={20} /> {t('workoutLog.lastTwoSessions')}</h2>
				<p class="history-subtitle">{t('workoutLog.compareSubtitle')}</p>
			</div>
			<a href={resolve('/history')} class="history-link">{t('workoutLog.viewFullHistory')}</a>
		</div>

		{#if previousSessions.length === 0}
			<p style="color:rgba(255,255,255,0.5)">
				{t('workoutLog.noWorkoutsSavedYet')}
			</p>
		{:else}
			{#each previousSessions as s (s.session.id)}
				<SessionCard session={s} />
			{/each}
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 1600px;
		margin: 0 auto;
		padding: 2rem;
		position: relative;
		z-index: 2;
	}

	/* Header */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
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
		font-size: 1.6rem;
		font-weight: 800;
		margin: 0;
		color: white;
		letter-spacing: -0.5px;
	}
	.date {
		font-size: 0.78rem;
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

	/* Day tabs */
	.day-section {
		margin-bottom: 1.75rem;
	}
	.section-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.65);
		letter-spacing: 2px;
		font-weight: 700;
		margin: 0 0 0.75rem;
	}
	.day-tabs {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.day-tab {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		border: 1px solid var(--border-strong);
		background: var(--bg-input);
		cursor: pointer;
		transition: 0.2s;
		min-width: 90px;
		font-family: inherit;
		color: white;
	}
	.day-tab:hover {
		border-color: var(--accent, #7c3aed);
	}
	.day-tab.active {
		border-color: var(--accent, #7c3aed);
		background: color-mix(in srgb, var(--accent, #7c3aed) 10%, var(--bg-input));
		box-shadow: 0 0 0 1px var(--accent, #7c3aed);
	}
	.tab-day {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--text-faint);
	}
	.day-tab.active .tab-day {
		color: var(--accent, #7c3aed);
	}
	.tab-name {
		font-size: 0.92rem;
		font-weight: 700;
		color: white;
		margin: 0.2rem 0 0.15rem;
	}
	.tab-count {
		font-size: 0.62rem;
		color: rgba(255, 255, 255, 0.75);
	}

	/* Dashboard grid */
	.dashboard {
		display: grid;
		grid-template-columns: minmax(700px, 900px) 320px;
		justify-content: start;
		gap: 32px;
	}
	.left-panel {
		display: flex;
		flex-direction: column;
	}
	.right-panel {
		position: sticky;
		top: 20px;
	}

	/* Exercise cards */
	.exercises {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.ex-card {
		background: var(--bg-panel);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 22px;
		overflow: hidden;
		position: relative;
		transition: 0.3s ease;
	}
	.ex-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		width: 5px;
		height: 100%;
		background: linear-gradient(to bottom, var(--card-accent, #7c3aed), transparent);
	}
	.ex-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 45px rgba(124, 58, 237, 0.25);
	}
	.ex-header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 1.6rem 2rem;
		border-bottom: 1px solid var(--border-strong);
	}
	.ex-num {
		width: 54px;
		height: 54px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: 16px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--card-accent, #7c3aed) 40%, black),
			color-mix(in srgb, var(--card-accent, #7c3aed) 10%, black)
		);
		color: white;
		font-size: 1.2rem;
		font-weight: 800;
	}
	.ex-name {
		flex: 1;
		background: transparent;
		border: none;
		font-size: 1.05rem;
		font-weight: 800;
		color: white;
		outline: none;
		font-family: inherit;
		padding: 0;
	}
	.ex-name::placeholder {
		color: var(--text-placeholder);
		font-weight: 500;
	}
	.ex-remove {
		background: none;
		border: none;
		color: var(--text-placeholder);
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 6px;
		display: flex;
		align-items: center;
		transition: 0.2s;
	}
	.ex-remove:hover {
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
	}
	.ex-watch {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		padding: 0.4rem 0.75rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--border-subtle);
		color: var(--text-muted);
		font-size: 0.72rem;
		font-weight: 700;
		text-decoration: none;
		transition: 0.2s;
	}
	.ex-watch:hover {
		border-color: var(--accent-blue);
		color: var(--accent-volt);
		background: color-mix(in srgb, var(--accent-blue) 14%, transparent);
	}

	/* History */
	.history {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 18px;
		padding: 1.2rem;
		margin: 1.2rem;
	}
	.history-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.65rem;
		text-transform: uppercase;
		color: white;
		letter-spacing: 2px;
		font-weight: 700;
		margin-bottom: 0.6rem;
	}
	.history-rows {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.history-row {
		display: grid;
		grid-template-columns: 48px 1fr 20px 1fr;
		align-items: center;
		gap: 0.55rem;
	}
	.h-set-badge {
		font-weight: 800;
		box-shadow: 0 0 18px rgba(79, 142, 251, 0.25);
		border-radius: 8px;
		padding: 0.3rem 0.65rem;
	}
	.h-weight {
		font-weight: 700;
		color: white;
		white-space: nowrap;
	}
	.h-x {
		color: white;
		opacity: 0.85;
		font-weight: 700;
		margin: 0 0.45rem;
	}
	.h-reps {
		font-weight: 700;
		color: white;
		white-space: nowrap;
	}
	.h-unit {
		font-size: 0.7rem;
		color: var(--text-faint);
		margin-left: 2px;
	}

	/* Sets */
	.sets {
		padding: 2rem;
	}
	.sets-header {
		display: grid;
		grid-template-columns: 60px 1fr 1fr 40px 40px 40px;
		gap: 16px;
		margin-bottom: 12px;
		text-transform: uppercase;
		letter-spacing: 2px;
		font-size: 0.8rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.7);
		text-align: center;
	}
	.set-row {
		display: grid;
		grid-template-columns: 60px 1fr 1fr 40px 40px 40px;
		gap: 16px;
		align-items: center;
		margin-bottom: 14px;
	}
	.set-badge {
		position: relative;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 16px;
		font-size: 1.15rem;
		font-weight: 800;
		border: 1px solid rgba(79, 142, 251, 0.35);
		transition: 0.2s;
	}
	.set-badge:hover {
		transform: scale(1.08);
	}
	.set-badge.pr {
		border-color: var(--accent-volt);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-volt) 40%, transparent);
	}
	.pr-flag {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-volt);
		color: var(--bg-deep);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}
	.set-timer-btn {
		background: none;
		border: 1px solid var(--border-strong);
		color: var(--text-faint);
		cursor: pointer;
		padding: 0;
		width: 100%;
		height: 100%;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: 0.2s;
	}
	.set-timer-btn:hover {
		border-color: var(--accent-teal);
		color: var(--accent-teal);
	}
	.set-done-btn {
		background: none;
		border: 1px solid var(--border-strong);
		color: var(--text-faint);
		cursor: pointer;
		padding: 0;
		width: 100%;
		height: 100%;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: 0.2s;
	}
	.set-done-btn:hover {
		border-color: var(--accent-green);
		color: var(--accent-green);
	}
	.set-done-btn.done {
		background: var(--accent-green);
		border-color: var(--accent-green);
		color: white;
	}
	.set-row.done {
		background: color-mix(in srgb, var(--accent-green) 8%, transparent);
		border-radius: 18px;
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-green) 25%, transparent);
	}
	.set-field {
		width: 100%;
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
	}
	.input-shell {
		position: relative;
		flex: 1;
		min-width: 0;
	}
	.input-shell input {
		width: 100%;
		height: 56px;
		padding: 0 48px 0 16px;
		text-align: center;
		border-radius: 18px;
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: white;
		font-size: 1rem;
		font-weight: 600;
		font-family: inherit;
		outline: none;
		transition: 0.2s;
		-moz-appearance: textfield;
	}
	.input-shell input::-webkit-outer-spin-button,
	.input-shell input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.input-shell input:focus {
		border-color: var(--focus-color, #4f8efb);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--focus-color, #4f8efb) 15%, transparent);
	}
	.input-shell input::placeholder {
		color: var(--text-placeholder);
	}
	.input-unit {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-faint);
		font-size: 0.8rem;
		font-weight: 700;
		pointer-events: none;
	}
	.last-box {
		flex: 0 0 76px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed var(--border-strong);
	}
	.last-box-label {
		font-size: 0.58rem;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 700;
		color: var(--text-faint);
	}
	.last-box-value {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.last-box-unit {
		font-size: 0.65rem;
		font-weight: 600;
		margin-left: 1px;
		color: var(--text-faint);
	}
	.last-box-arrow {
		margin-left: 3px;
		font-weight: 800;
	}
	.last-box.up .last-box-value,
	.last-box.up .last-box-arrow {
		color: var(--accent-green);
	}
	.last-box.down .last-box-value,
	.last-box.down .last-box-arrow {
		color: var(--accent-red);
	}
	.set-remove {
		background: none;
		border: none;
		color: var(--text-faint);
		cursor: pointer;
		padding: 0.3rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: 0.25s;
		opacity: 0.75;
	}
	.set-remove:hover {
		color: #ff5f73;
		background: rgba(255, 95, 115, 0.12);
		opacity: 1;
	}
	.set-remove:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.set-remove:disabled:hover {
		color: var(--text-faint);
		background: none;
	}
	.add-set {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		margin-top: 0.5rem;
		width: 100%;
		background: transparent;
		border: 1px dashed var(--border-strong);
		color: var(--text-placeholder);
		padding: 0.55rem;
		border-radius: 10px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: 0.2s;
		font-family: inherit;
	}
	.add-set:hover {
		border-color: #7c3aed;
		color: #7c3aed;
	}

	/* Video attach */
	.video-input {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		opacity: 0;
	}
	.video-attach {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-top: 1rem;
		padding: 0.9rem 1.2rem;
		border-radius: var(--radius-md);
		background: var(--bg-panel);
		border: 1px dashed var(--border-strong);
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: 0.2s;
	}
	.video-attach:hover {
		border-color: var(--accent-blue);
		color: var(--text-primary);
	}
	.video-attach:has(+ .video-input:focus-visible) {
		border-color: var(--accent-blue);
	}

	/* Bottom bar */
	.bottom-bar {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
		position: sticky;
		bottom: 1.5rem;
	}
	.bottom-bar :global(.btn.full) {
		flex: 1;
	}

	/* Summary */
	.summary-card {
		background: #0d1528;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		padding: 24px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
	}
	.summary-card h3 {
		margin: 0 0 20px;
		color: white;
		font-size: 1.2rem;
		font-weight: 800;
	}
	.summary-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.stat {
		padding: 28px 16px;
		border-radius: 22px;
		min-height: 140px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: 0.3s;
		text-align: center;
	}
	.stat:hover {
		transform: translateY(-3px);
		border-color: #7c3aed;
		box-shadow: 0 12px 30px rgba(124, 58, 237, 0.25);
	}
	.value {
		display: block;
		font-size: 3rem;
		font-weight: 900;
		background: linear-gradient(135deg, #7c3aed, #ec4899);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.label {
		display: block;
		margin-top: 8px;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 600;
	}

	/* Rest timer */
	.timer-card {
		background: #0d1528;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		padding: 24px;
		margin-top: 20px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
	}
	.timer-card h3 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 16px;
		color: white;
		font-size: 1.05rem;
		font-weight: 800;
	}
	.timer-display {
		text-align: center;
		font-family: var(--font-display);
		font-size: 2.6rem;
		font-weight: 700;
		color: var(--accent-teal);
		background: rgba(255, 255, 255, 0.03);
		border-radius: 16px;
		padding: 0.8rem;
		margin-bottom: 14px;
		transition: 0.2s;
	}
	.timer-display.running {
		color: var(--accent-volt);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-volt) 30%, transparent);
	}
	.timer-display.idle {
		color: var(--text-faint);
	}
	.timer-presets {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		margin-bottom: 14px;
	}
	.timer-preset {
		padding: 0.5rem 0;
		border-radius: 10px;
		border: 1px solid var(--border-strong);
		background: var(--bg-input);
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: 0.2s;
	}
	.timer-preset.active {
		border-color: var(--accent-teal);
		color: var(--accent-teal);
		background: color-mix(in srgb, var(--accent-teal) 12%, var(--bg-input));
	}
	.timer-controls {
		display: flex;
		gap: 0.6rem;
	}
	.timer-controls :global(.btn) {
		flex: 1;
	}

	/* Personal records */
	.records-card {
		background: #0d1528;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 24px;
		padding: 24px;
		margin-top: 20px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
	}
	.records-card h3 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 16px;
		color: white;
		font-size: 1.05rem;
		font-weight: 800;
	}
	.records-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-height: 360px;
		overflow-y: auto;
		padding-right: 0.3rem;
		margin-right: -0.3rem;
	}
	.records-list::-webkit-scrollbar {
		width: 6px;
	}
	.records-list::-webkit-scrollbar-thumb {
		background: var(--border-strong);
		border-radius: 999px;
	}
	.record-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		padding: 0.7rem 0.9rem;
	}
	.record-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.record-info strong {
		font-size: 0.85rem;
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.record-info span {
		font-size: 0.75rem;
		color: var(--accent-volt);
		font-weight: 700;
	}
	.record-spark {
		width: 70px;
		height: 28px;
		flex-shrink: 0;
	}

	/* Success */
	.success-card {
		margin-top: 1.5rem;
		padding: 1.2rem 1.4rem;
		border-radius: 18px;
		background: linear-gradient(135deg, #16a34a, #22c55e);
		box-shadow: 0 10px 25px rgba(34, 197, 94, 0.35);
	}
	.success-head {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: white;
		font-weight: 700;
		text-align: center;
	}
	.success-chips {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 0.9rem;
	}
	.success-chip {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.8rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.18);
		color: white;
		font-size: 0.8rem;
		font-weight: 700;
	}
	.success-chip.pr {
		background: rgba(255, 255, 255, 0.22);
	}
	.success-chip.down {
		background: rgba(0, 0, 0, 0.3);
	}

	/* History section */
	.workout-history {
		margin-top: 3rem;
	}
	.workout-history h2 {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 1.8rem;
		font-weight: 800;
		color: white;
		margin-bottom: 0.4rem;
		letter-spacing: -0.5px;
	}
	.history-subtitle {
		color: rgba(255, 255, 255, 0.7);
		margin: 0;
		font-size: 0.95rem;
	}
	.workout-history-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 0.8rem;
		margin-bottom: 1.8rem;
	}
	.history-link {
		color: var(--accent-blue);
		font-weight: 700;
		font-size: 0.85rem;
		text-decoration: none;
		white-space: nowrap;
	}
	.history-link:hover {
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 1000px) {
		.dashboard {
			grid-template-columns: 1fr;
		}
		.right-panel {
			position: static;
		}
	}
	@media (max-width: 600px) {
		.sets-header {
			grid-template-columns: 36px 1fr 1fr 24px 24px 24px;
			gap: 8px;
		}
		.set-row {
			grid-template-columns: 36px 1fr 1fr 24px 24px 24px;
			gap: 8px;
		}
		.bottom-bar {
			flex-direction: column;
			position: static;
		}
		.day-tab {
			min-width: 75px;
		}
		.header {
			flex-wrap: wrap;
			gap: 0.8rem;
		}
		.stat {
			min-height: 100px;
			padding: 16px;
		}
		.value {
			font-size: 2rem;
		}
		.input-shell input {
			height: 44px;
			padding: 0 36px 0 8px;
			font-size: 0.85rem;
		}
		.set-field {
			flex-wrap: wrap;
		}
		.last-box {
			flex: 1 1 100%;
			flex-direction: row;
			gap: 5px;
			padding: 3px 0;
		}
		.set-badge {
			width: 40px;
			height: 40px;
			font-size: 0.9rem;
		}
		.ex-num {
			width: 40px;
			height: 40px;
			font-size: 0.9rem;
		}
		.sets {
			padding: 1rem;
		}
		.ex-header {
			padding: 1rem;
		}
		.history {
			margin: 0.8rem;
			padding: 0.8rem;
		}
	}
</style>
