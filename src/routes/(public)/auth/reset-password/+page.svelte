<script>
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import { PASSWORD_RULES } from '$lib/password.js';

	let { data, form } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let passwordTouched = $state(false);
	let confirmTouched = $state(false);
	const passwordsMatch = $derived(confirmPassword.length > 0 ? password === confirmPassword : null);
</script>

<svelte:head>
	<title>Reset Password | AI Fitness Coach</title>
</svelte:head>

<div class="auth-page motion-in">
	<div class="auth-card">
		<div class="auth-icon"><Icon name="lock" size={22} /></div>
		<h1>Set a new password</h1>

		{#if !data.token}
			<p class="subtitle">
				This reset link is missing its token. Request a new one from the
				<a href={resolve('/auth/forgot-password')}>forgot password</a> page.
			</p>
		{:else}
			<p class="subtitle">Choose a new password for your account.</p>

			<form method="POST">
				<input type="hidden" name="token" value={data.token} />
				<label>
					<span class="label-text"><Icon name="lock" size={14} /> New password</span>
					<input
						type="password"
						name="password"
						bind:value={password}
						onfocus={() => (passwordTouched = true)}
						placeholder="Create a strong password"
						required
					/>
				</label>

				{#if passwordTouched}
					<ul class="rules">
						{#each PASSWORD_RULES as rule (rule.key)}
							{@const met = rule.test(password)}
							<li class:met>
								<Icon name={met ? 'check' : 'close'} size={12} />
								{rule.label}
							</li>
						{/each}
					</ul>
				{/if}

				<label>
					<span class="label-text"><Icon name="lock" size={14} /> Confirm new password</span>
					<input
						type="password"
						name="confirmPassword"
						bind:value={confirmPassword}
						onfocus={() => (confirmTouched = true)}
						placeholder="Re-enter your new password"
						required
					/>
				</label>

				{#if confirmTouched && passwordsMatch !== null}
					<p class="match {passwordsMatch ? 'match-good' : 'match-bad'}">
						<Icon name={passwordsMatch ? 'check' : 'close'} size={12} />
						{passwordsMatch ? 'Passwords match' : "Passwords don't match"}
					</p>
				{/if}

				{#if form?.error}
					<div class="error"><Icon name="alert" size={14} /> {form.error}</div>
				{/if}

				<Button type="submit" variant="primary" full disabled={passwordsMatch === false}
					>Set new password</Button
				>
			</form>
		{/if}
	</div>
</div>

<style>
	.auth-page {
		position: relative;
		min-height: calc(100vh - 65px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		isolation: isolate;
		overflow: hidden;
	}
	.auth-page::before,
	.auth-page::after {
		content: '';
		position: absolute;
		width: 420px;
		height: 420px;
		border-radius: 999px;
		filter: blur(110px);
		opacity: 0.3;
		z-index: -1;
		pointer-events: none;
	}
	.auth-page::before {
		top: -140px;
		left: -120px;
		background: var(--accent-blue);
	}
	.auth-page::after {
		bottom: -140px;
		right: -120px;
		background: var(--accent-purple);
	}
	.auth-card {
		position: relative;
		width: 100%;
		max-width: 400px;
		background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		padding: 2.5rem;
		box-shadow: var(--shadow-panel);
		text-align: center;
	}
	.auth-icon {
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
		margin: 0 0 0.4rem;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.5px;
	}
	.subtitle {
		margin: 0 0 1.8rem;
		color: var(--text-muted);
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.subtitle a {
		color: var(--accent-blue);
		text-decoration: none;
		font-weight: 700;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		text-align: left;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.label-text {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	input {
		padding: 0.85rem 1rem;
		border-radius: var(--radius-sm);
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.95rem;
		outline: none;
		transition: 0.2s;
	}
	input:focus {
		border-color: var(--accent-blue);
		box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
	}
	.rules {
		list-style: none;
		margin: -0.4rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.rules li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		color: var(--text-faint);
		transition: color 0.2s;
	}
	.rules li.met {
		color: var(--accent-green);
	}
	.match {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: -0.4rem 0 0;
		font-size: 0.78rem;
		font-weight: 600;
	}
	.match-good {
		color: var(--accent-green);
	}
	.match-bad {
		color: var(--accent-red);
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
</style>
