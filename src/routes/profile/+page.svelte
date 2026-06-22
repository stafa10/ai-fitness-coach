<script>
	let { form } = $props();
</script>

<svelte:head>
	<title>Profile | AI Fitness Coach</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="header">
			<h1 class="title">Build Your Fitness Profile</h1>
			<p class="subtitle">Tell us about yourself so we can personalise your training journey.</p>
		</div>

		<form method="POST" class="form">
			<div class="section">
				<h2>Personal Details</h2>

				<div class="row">
					<div class="field">
						<label for="age">Age</label>
						<input id="age" name="age" type="number" placeholder="Enter your age" required min="15" />
					</div>

					<div class="field">
						<label for="gender">Gender</label>
						<select id="gender" name="gender" required>
							<option value="">Select gender</option>
							<option value="Male">Male</option>
							<option value="Female">Female</option>
							<option value="Other">Other</option>
						</select>
					</div>
				</div>

				<div class="row">
					<div class="field">
						<label for="height">Height (cm)</label>
						<input id="height" name="height" type="number" placeholder="e.g. 170" required min="0" step="0.1" />
					</div>

					<div class="field">
						<label for="weight">Weight (kg)</label>
						<input id="weight" name="weight" type="number" placeholder="e.g. 70" required min="0" step="0.1" />
					</div>
				</div>
			</div>

			<div class="section">
				<h2>Fitness Goals</h2>

				<div class="row">
					<div class="field">
						<label for="goal">Fitness Goal</label>
						<select id="goal" name="goal" required>
							<option value="">Select your goal</option>
							<option value="Weight Loss">Weight Loss</option>
							<option value="Muscle Gain">Muscle Gain</option>
							<option value="Strength Building">Strength Building</option>
							<option value="General Fitness">General Fitness</option>
						</select>
					</div>

					<div class="field">
						<label for="experience">Experience Level</label>
						<select id="experience" name="experience" required>
							<option value="">Select experience level</option>
							<option value="Beginner">Beginner</option>
							<option value="Intermediate">Intermediate</option>
							<option value="Advanced">Advanced</option>
						</select>
					</div>
				</div>

				<div class="row">
					<div class="field">
						<label for="activity">Activity Level</label>
						<select id="activity" name="activity" required>
							<option value="">Select activity level</option>
							<option value="Sedentary">Sedentary</option>
							<option value="Lightly Active">Lightly Active</option>
							<option value="Moderately Active">Moderately Active</option>
							<option value="Very Active">Very Active</option>
						</select>
					</div>

					<div class="field">
						<label for="workout_days">Workout Days / Week</label>
						<input id="workout_days" name="workout_days" type="number" placeholder="e.g. 3" required min="1" max="7" />
					</div>
				</div>
			</div>

			<div class="section">
				<h2>Training Preferences</h2>

				<div class="field">
					<label for="equipment">Equipment Access</label>
					<select id="equipment" name="equipment" required>
						<option value="">Select equipment access</option>
						<option value="Full Gym">Full Gym</option>
						<option value="Home Dumbbells">Home Dumbbells</option>
						<option value="Resistance Bands">Resistance Bands</option>
						<option value="No Equipment">No Equipment</option>
					</select>
				</div>

				<div class="field">
					<label for="injuries">Injuries / Limitations</label>
					<input id="injuries" name="injuries" type="text" placeholder="e.g. Lower back pain, knee issue, none" />
				</div>
			</div>

			<button type="submit">Create My Profile</button>
		</form>

		{#if form?.success}
			<div class="success">Profile saved successfully.</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		font-family: Arial, sans-serif;
		background: linear-gradient(135deg, #0f172a, #1e3a8a, #14b8a6);
	}

	.page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 2rem;
	}

	.card {
		width: 100%;
		max-width: 760px;
		background: rgba(255, 255, 255, 0.97);
		padding: 2rem;
		border-radius: 28px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
		backdrop-filter: blur(8px);
		transition: transform 0.2s, box-shadow 0.3s;
	}
	.card:hover {
		transform: translateY(-3px);
		box-shadow: 0 28px 65px rgba(20, 184, 166, 0.2);
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.title {
		margin: 0 0 0.5rem;
		font-size: 2.2rem;
		font-weight: 800;
		color: #1e3a8a;
		transition: color 0.2s;
	}
	.title:hover {
		color: #0d9488;
	}

	.subtitle {
		margin: 0;
		color: #475569;
		font-size: 1rem;
		line-height: 1.5;
		transition: color 0.2s;
	}
	.subtitle:hover {
		color: #1e293b;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.section {
		padding: 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		background: linear-gradient(180deg, #ffffff, #f8fafc);
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
	}

	.section h2 {
		margin: 0 0 1rem;
		font-size: 1.05rem;
		font-weight: 800;
		color: #0f172a;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.row:last-child {
		margin-bottom: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 700;
		color: #0f172a;
		transition: color 0.2s, transform 0.2s;
	}
	label:hover {
		color: #0d9488;
		transform: translateX(4px);
	}

	input,
	select,
	button {
		width: 100%;
		box-sizing: border-box;
		padding: 14px;
		border-radius: 14px;
		font-size: 1rem;
	}

	input,
	select {
		border: 1px solid #cbd5e1;
		background: #f8fafc;
		transition: border-color 0.3s, box-shadow 0.3s, background 0.2s, transform 0.2s;
	}
	input:hover,
	select:hover {
		border-color: #60a5fa;
		background: #f1f5f9;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(96, 165, 250, 0.15);
	}
	input:focus,
	select:focus {
		outline: none;
		border-color: #14b8a6;
		box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.18);
	}

	button {
		margin-top: 0.5rem;
		border: none;
		font-weight: 800;
		color: white;
		cursor: pointer;
		background: linear-gradient(135deg, #1e3a8a, #14b8a6);
		box-shadow: 0 12px 28px rgba(30, 58, 138, 0.2);
		transition: transform 0.2s, box-shadow 0.3s, background 0.3s;
	}
	button:hover {
		transform: translateY(-3px) scale(1.01);
		box-shadow: 0 16px 34px rgba(20, 184, 166, 0.35);
		background: linear-gradient(135deg, #1d4ed8, #0f766e);
	}
	button:active {
		transform: translateY(0) scale(0.98);
	}

	.success {
		margin-top: 1rem;
		padding: 12px;
		text-align: center;
		font-weight: 700;
		color: #065f46;
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		border-radius: 14px;
		transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.3s;
	}
	.success:hover {
		background: #d1fae5;
		border-color: #6ee7b7;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(6, 95, 70, 0.15);
	}

	@media (max-width: 700px) {
		.card {
			padding: 1.25rem;
		}

		.row {
			grid-template-columns: 1fr;
		}

		.title {
			font-size: 1.8rem;
		}
	}
</style>