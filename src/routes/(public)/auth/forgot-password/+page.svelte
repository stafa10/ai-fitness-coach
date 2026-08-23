<script>
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';

	let { form } = $props();
	let email = $state('');
</script>

<svelte:head>
	<title>Forgot Password | AI Fitness Coach</title>
</svelte:head>

<div class="auth-page motion-in">
	<div class="auth-card">
		{#if form?.success}
			<div class="auth-icon"><Icon name="mail" size={22} /></div>
			<h1>Check your email</h1>
			<p class="subtitle">If an account exists for that email, a reset link is on its way.</p>
			<p class="switch">Back to <a href={resolve('/auth/login')}>sign in</a></p>
		{:else}
			<div class="auth-icon"><Icon name="lock" size={22} /></div>
			<h1>Reset your password</h1>
			<p class="subtitle">Enter your email and we'll send you a link to set a new password.</p>

			<form method="POST">
				<label>
					<span class="label-text"><Icon name="mail" size={14} /> Email</span>
					<input
						type="email"
						name="email"
						bind:value={email}
						placeholder="you@example.com"
						required
					/>
				</label>

				{#if form?.error}
					<div class="error"><Icon name="alert" size={14} /> {form.error}</div>
				{/if}

				<Button type="submit" variant="primary" full>Send reset link</Button>
			</form>

			<p class="switch">Remembered it? <a href={resolve('/auth/login')}>Sign in</a></p>
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
	.switch {
		margin: 1.5rem 0 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.switch a {
		color: var(--accent-blue);
		font-weight: 700;
		text-decoration: none;
	}
	.switch a:hover {
		text-decoration: underline;
	}
</style>
