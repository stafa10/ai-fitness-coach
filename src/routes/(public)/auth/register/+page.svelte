<script>
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import { PASSWORD_RULES } from '$lib/password.js';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';

	let { form } = $props();

	let name = $state(form?.name ?? '');
	let email = $state(form?.email ?? '');
	let password = $state('');
	let confirmPassword = $state('');
	let passwordTouched = $state(false);
	let confirmTouched = $state(false);
	const passwordsMatch = $derived(confirmPassword.length > 0 ? password === confirmPassword : null);
	let avatarPreview = $state('');
	let avatarInputEl = $state(null);

	const i18n = getI18n();
	const t = i18n.t;

	function onAvatarChange(e) {
		const file = e.currentTarget.files?.[0];
		avatarPreview = file ? URL.createObjectURL(file) : '';
	}
</script>

<svelte:head>
	<title>Create Account | AI Fitness Coach</title>
</svelte:head>

<div class="auth-page motion-in">
	<div class="auth-card">
		{#if form?.success}
			<div class="auth-icon"><Icon name="mail" size={22} /></div>
			<h1>{t('auth.register.checkEmailTitle')}</h1>
			<p class="subtitle">
				{t('auth.register.checkEmailText', { email: form.email })}
			</p>
			<p class="switch">
				{t('auth.register.alreadyVerified')}
				<a href={resolve('/auth/login')}>{t('auth.register.signIn')}</a>
			</p>
		{:else}
			<div class="auth-icon"><Icon name="dumbbell" size={22} /></div>
			<h1>{t('auth.register.title')}</h1>
			<p class="subtitle">{t('auth.register.subtitle')}</p>

			<form method="POST" enctype="multipart/form-data">
				<div class="avatar-picker">
					<button
						type="button"
						class="avatar-btn"
						onclick={() => avatarInputEl?.click()}
						aria-label={t('auth.register.choosePhotoAria')}
					>
						{#if avatarPreview}
							<img src={avatarPreview} alt="" />
						{:else}
							<Icon name="user" size={24} />
						{/if}
						<span class="avatar-edit"><Icon name="edit" size={11} /></span>
					</button>
					<input
						bind:this={avatarInputEl}
						type="file"
						name="avatar"
						accept="image/*"
						class="avatar-input"
						onchange={onAvatarChange}
					/>
					<span class="avatar-hint">{t('auth.register.photoOptional')}</span>
				</div>

				<label>
					<span class="label-text"
						><Icon name="user" size={14} /> {t('auth.register.nameLabel')}</span
					>
					<input
						type="text"
						name="name"
						bind:value={name}
						placeholder={t('auth.register.namePlaceholder')}
						required
					/>
				</label>

				<label>
					<span class="label-text"
						><Icon name="mail" size={14} /> {t('auth.register.emailLabel')}</span
					>
					<input
						type="email"
						name="email"
						bind:value={email}
						placeholder={t('auth.register.emailPlaceholder')}
						required
					/>
				</label>

				<label>
					<span class="label-text"
						><Icon name="lock" size={14} /> {t('auth.register.passwordLabel')}</span
					>
					<input
						type="password"
						name="password"
						bind:value={password}
						onfocus={() => (passwordTouched = true)}
						placeholder={t('auth.register.passwordPlaceholder')}
						required
					/>
				</label>

				{#if passwordTouched}
					<ul class="rules">
						{#each PASSWORD_RULES as rule (rule.key)}
							{@const met = rule.test(password)}
							<li class:met>
								<Icon name={met ? 'check' : 'close'} size={12} />
								{t(`auth.passwordRules.${rule.key}`)}
							</li>
						{/each}
					</ul>
				{/if}

				<label>
					<span class="label-text"
						><Icon name="lock" size={14} /> {t('auth.register.confirmPasswordLabel')}</span
					>
					<input
						type="password"
						name="confirmPassword"
						bind:value={confirmPassword}
						onfocus={() => (confirmTouched = true)}
						placeholder={t('auth.register.confirmPasswordPlaceholder')}
						required
					/>
				</label>

				{#if confirmTouched && passwordsMatch !== null}
					<p class="match {passwordsMatch ? 'match-good' : 'match-bad'}">
						<Icon name={passwordsMatch ? 'check' : 'close'} size={12} />
						{passwordsMatch
							? t('auth.register.passwordsMatch')
							: t('auth.register.passwordsNoMatch')}
					</p>
				{/if}

				{#if form?.error}
					<div class="error"><Icon name="alert" size={14} /> {form.error}</div>
				{/if}

				<Button type="submit" variant="primary" full disabled={passwordsMatch === false}
					>{t('auth.register.createAccount')}</Button
				>
			</form>

			<p class="switch">
				{t('auth.register.alreadyHaveAccount')}
				<a href={resolve('/auth/login')}>{t('auth.register.signIn')}</a>
			</p>
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
	.avatar-picker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.3rem;
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
		width: 84px;
		height: 84px;
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
		right: 2px;
		bottom: 2px;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		background: var(--gradient-accent);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
	}
	.avatar-hint {
		font-size: 0.75rem;
		color: var(--text-faint);
		font-weight: 600;
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
