<script>
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';

	const i18n = getI18n();
	const t = i18n.t;
	const tEnum = i18n.tEnum;

	let { data, form } = $props();
	const profile = data?.profile ?? null;

	let avatarPreview = $state(data?.avatarUrl ?? '');
	let avatarInputEl = $state(null);

	function onAvatarChange(e) {
		const file = e.currentTarget.files?.[0];
		if (file) {
			avatarPreview = URL.createObjectURL(file);
			e.currentTarget.form.requestSubmit();
		}
	}

	let age = $state(profile?.age ?? '');
	let gender = $state(profile?.gender ?? '');
	let height = $state(profile?.height ? Number(profile.height) : '');
	let weight = $state(profile?.weight ? Number(profile.weight) : '');
	let goal = $state(profile?.goal ?? '');
	let experience = $state(profile?.experience ?? '');
	let activity = $state(profile?.activityLevel ?? '');
	let workoutDays = $state(profile?.workoutDays ?? '');
	let equipment = $state(profile?.equipmentAccess ?? '');
	let injuries = $state(profile?.injuries ?? '');
</script>

<svelte:head>
	<title>Profile | AI Fitness Coach</title>
</svelte:head>

<div class="page motion-in">
	<div class="avatar-card">
		<form method="POST" action="?/changeAvatar" enctype="multipart/form-data">
			<button
				type="button"
				class="avatar-btn"
				onclick={() => avatarInputEl?.click()}
				aria-label={t('profile.changePhotoAria')}
			>
				{#if avatarPreview}
					<img src={avatarPreview} alt="" />
				{:else}
					<Icon name="user" size={28} />
				{/if}
				<span class="avatar-edit"><Icon name="edit" size={12} /></span>
			</button>
			<input
				bind:this={avatarInputEl}
				type="file"
				name="avatar"
				accept="image/*"
				class="avatar-input"
				onchange={onAvatarChange}
			/>
		</form>
		<div class="avatar-meta">
			<p class="avatar-title">{t('profile.profilePhoto')}</p>
			{#if form?.avatarError}
				<p class="avatar-status avatar-error"><Icon name="alert" size={12} /> {form.avatarError}</p>
			{:else if form?.avatarSuccess}
				<p class="avatar-status avatar-success">
					<Icon name="check" size={12} />
					{t('profile.photoUpdated')}
				</p>
			{:else}
				<p class="avatar-status">
					{t('profile.photoHint')}
				</p>
			{/if}
		</div>
	</div>

	<div class="card">
		<div class="card-icon"><Icon name="user" size={22} /></div>
		<h1>{profile ? t('profile.updateTitle') : t('profile.buildTitle')}</h1>
		<p class="subtitle">{t('profile.subtitle')}</p>

		<form method="POST" action="?/save" class="form">
			<p class="section-label">{t('profile.aboutYou')}</p>
			<div class="row">
				<div class="field">
					<label for="age">{t('profile.age')}</label>
					<input
						id="age"
						name="age"
						type="number"
						placeholder={t('profile.agePlaceholder')}
						bind:value={age}
						required
						min="15"
					/>
				</div>

				<div class="field">
					<label for="gender">{t('profile.gender')}</label>
					<select id="gender" name="gender" bind:value={gender}>
						<option value="">{t('profile.selectGender')}</option>
						<option value="Male">{tEnum('gender', 'Male')}</option>
						<option value="Female">{tEnum('gender', 'Female')}</option>
						<option value="Other">{tEnum('gender', 'Other')}</option>
					</select>
				</div>
			</div>

			<div class="row">
				<div class="field">
					<label for="height">{t('profile.height')}</label>
					<input
						id="height"
						name="height"
						type="number"
						placeholder={t('profile.heightPlaceholder')}
						bind:value={height}
						required
						min="0"
						step="0.1"
					/>
				</div>

				<div class="field">
					<label for="weight">{t('profile.weight')}</label>
					<input
						id="weight"
						name="weight"
						type="number"
						placeholder={t('profile.weightPlaceholder')}
						bind:value={weight}
						required
						min="0"
						step="0.1"
					/>
				</div>
			</div>

			<p class="section-label">{t('profile.trainingPreferences')}</p>
			<div class="row">
				<div class="field">
					<label for="goal">{t('profile.fitnessGoal')}</label>
					<select id="goal" name="goal" bind:value={goal} required>
						<option value="">{t('profile.selectGoal')}</option>
						<option value="Weight Loss">{tEnum('goal', 'Weight Loss')}</option>
						<option value="Muscle Gain">{tEnum('goal', 'Muscle Gain')}</option>
						<option value="Strength Building">{tEnum('goal', 'Strength Building')}</option>
						<option value="General Fitness">{tEnum('goal', 'General Fitness')}</option>
					</select>
				</div>

				<div class="field">
					<label for="experience">{t('profile.experienceLevel')}</label>
					<select id="experience" name="experience" bind:value={experience} required>
						<option value="">{t('profile.selectExperience')}</option>
						<option value="Beginner">{tEnum('experience', 'Beginner')}</option>
						<option value="Intermediate">{tEnum('experience', 'Intermediate')}</option>
						<option value="Advanced">{tEnum('experience', 'Advanced')}</option>
					</select>
				</div>
			</div>

			<div class="row">
				<div class="field">
					<label for="activity">{t('profile.activityLevel')}</label>
					<select id="activity" name="activity" bind:value={activity}>
						<option value="">{t('profile.selectActivity')}</option>
						<option value="Sedentary">{tEnum('activityLevel', 'Sedentary')}</option>
						<option value="Lightly Active">{tEnum('activityLevel', 'Lightly Active')}</option>
						<option value="Moderately Active">{tEnum('activityLevel', 'Moderately Active')}</option>
						<option value="Very Active">{tEnum('activityLevel', 'Very Active')}</option>
					</select>
				</div>

				<div class="field">
					<label for="workout_days">{t('profile.workoutDaysLabel')}</label>
					<input
						id="workout_days"
						name="workout_days"
						type="number"
						placeholder={t('profile.workoutDaysPlaceholder')}
						bind:value={workoutDays}
						min="1"
						max="7"
					/>
				</div>
			</div>

			<div class="field">
				<label for="equipment">{t('profile.equipmentAccess')}</label>
				<select id="equipment" name="equipment" bind:value={equipment}>
					<option value="">{t('profile.selectEquipment')}</option>
					<option value="Full Gym">{tEnum('equipmentAccess', 'Full Gym')}</option>
					<option value="Home Dumbbells">{tEnum('equipmentAccess', 'Home Dumbbells')}</option>
					<option value="Resistance Bands">{tEnum('equipmentAccess', 'Resistance Bands')}</option>
					<option value="Bodyweight Only">{tEnum('equipmentAccess', 'Bodyweight Only')}</option>
				</select>
			</div>

			<p class="section-label">{t('profile.healthNotes')}</p>
			<div class="field">
				<label for="injuries">{t('profile.injuries')}</label>
				<textarea
					id="injuries"
					name="injuries"
					rows="4"
					placeholder={t('profile.injuriesPlaceholder')}
					bind:value={injuries}></textarea>
			</div>

			{#if form?.error}
				<div class="error"><Icon name="alert" size={14} /> {form.error}</div>
			{/if}

			<Button type="submit" variant="primary" size="lg" full>
				<Icon name="check" size={16} />
				{t('profile.save')}
			</Button>
		</form>
	</div>
</div>

<style>
	.page {
		position: relative;
		min-height: calc(100vh - 65px);
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 2.5rem 2rem;
		isolation: isolate;
		overflow: hidden;
	}
	.page::before,
	.page::after {
		content: '';
		position: absolute;
		width: 460px;
		height: 460px;
		border-radius: 999px;
		filter: blur(120px);
		opacity: 0.25;
		z-index: -1;
		pointer-events: none;
	}
	.page::before {
		top: -160px;
		left: -140px;
		background: var(--accent-blue);
	}
	.page::after {
		bottom: -160px;
		right: -140px;
		background: var(--accent-purple);
	}

	.avatar-card {
		position: relative;
		width: 100%;
		max-width: 760px;
		display: flex;
		align-items: center;
		gap: 1.2rem;
		background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		padding: 1.4rem 1.8rem;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-panel);
		margin-bottom: 1.25rem;
	}
	.avatar-input {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		opacity: 0;
	}
	.avatar-btn {
		position: relative;
		width: 68px;
		height: 68px;
		flex-shrink: 0;
		border-radius: 999px;
		background: var(--bg-input);
		border: 1px dashed var(--border-strong);
		color: var(--text-faint);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		overflow: hidden;
		padding: 0;
		transition: 0.2s;
	}
	.avatar-btn:hover {
		border-color: var(--accent-blue);
		color: var(--text-primary);
	}
	.avatar-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.avatar-edit {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 20px;
		height: 20px;
		border-radius: 999px;
		background: var(--gradient-accent);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
	}
	.avatar-title {
		margin: 0 0 0.3rem;
		font-weight: 700;
		font-size: 0.95rem;
	}
	.avatar-status {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: var(--text-faint);
	}
	.avatar-error {
		color: var(--accent-red);
	}
	.avatar-success {
		color: var(--accent-green);
	}

	.card {
		position: relative;
		width: 100%;
		max-width: 760px;
		background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		padding: 2.5rem;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-panel);
		overflow: hidden;
	}
	.card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-accent);
	}

	.card-icon {
		width: 52px;
		height: 52px;
		margin: 0 auto 1.2rem;
		border-radius: 15px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-accent);
		box-shadow:
			var(--shadow-glow-blue),
			0 0 0 8px color-mix(in srgb, var(--accent-blue) 10%, transparent);
	}

	h1 {
		font-family: var(--font-display);
		margin: 0 0 0.5rem;
		text-align: center;
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.5px;
	}

	.section-label {
		margin: 0.4rem 0 -0.3rem;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: var(--accent-volt);
	}
	.section-label:first-of-type {
		margin-top: 0;
	}

	.subtitle {
		margin: 0 0 2rem;
		text-align: center;
		color: var(--text-muted);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	label {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	input,
	select,
	textarea {
		padding: 0.85rem 1rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-strong);
		background: var(--bg-input);
		color: var(--text-primary);
		font-size: 0.95rem;
		font-family: var(--font-sans);
		outline: none;
		transition: 0.2s;
	}

	select option {
		background: var(--bg-input);
	}

	input:focus,
	select:focus,
	textarea:focus {
		border-color: var(--accent-blue);
		box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
	}

	textarea {
		resize: vertical;
		min-height: 100px;
		font-family: var(--font-sans);
	}

	.error {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--accent-red);
		font-size: 0.85rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-sm);
		padding: 0.6rem 0.8rem;
	}

	@media (max-width: 700px) {
		.card {
			padding: 1.5rem;
		}
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
