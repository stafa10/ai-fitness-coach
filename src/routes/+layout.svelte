<script>
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/tokens.css';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { createI18nContext } from '$lib/i18n/i18n.svelte.js';

	let { data, children } = $props();
	const user = $derived(data?.user ?? null);
	const isAdmin = $derived(data?.isAdmin ?? false);

	const i18n = createI18nContext(data?.locale);
	const t = i18n.t;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<nav class="topnav">
		<a href={resolve('/')} class="brand">
			<span class="brand-icon"><Icon name="dumbbell" size={18} /></span>
			AI Fitness Coach
		</a>

		{#if user}
			<div class="nav-links">
				<a href={resolve('/dashboard')}>{t('nav.dashboard')}</a>
				<a href={resolve('/workout-log')}>{t('nav.workoutLog')}</a>
				<a href={resolve('/coach')}>{t('nav.aiCoach')}</a>
				<a href={resolve('/profile')}>{t('nav.profile')}</a>
				{#if isAdmin}
					<a href={resolve('/admin')} class="admin-link">{t('nav.admin')}</a>
				{/if}
			</div>
			<div class="nav-right">
				<LanguageSwitcher />
				<div class="user-chip">
					{#if user.image}
						<img class="user-avatar" src={user.image} alt="" />
					{:else}
						<span class="user-avatar user-avatar-fallback"
							>{user.name?.[0]?.toUpperCase() ?? '?'}</span
						>
					{/if}
					<span class="user-email">{user.email}</span>
				</div>
				<form method="POST" action="/auth/logout">
					<Button variant="ghost" size="sm" type="submit">
						<Icon name="logout" size={14} />
						{t('nav.signOut')}
					</Button>
				</form>
			</div>
		{:else}
			<div class="nav-right">
				<LanguageSwitcher />
				<Button href="/auth/login" variant="ghost" size="sm">{t('nav.signIn')}</Button>
				<Button href="/auth/register" variant="primary" size="sm">{t('nav.getStarted')}</Button>
			</div>
		{/if}
	</nav>

	<main class="content motion-in">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.topnav {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 1rem 2rem;
		border-bottom: 1px solid var(--border-subtle);
		background: rgba(10, 7, 20, 0.65);
		backdrop-filter: blur(12px);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
		text-decoration: none;
		letter-spacing: -0.3px;
	}
	.brand-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		background: var(--gradient-accent);
		box-shadow: var(--shadow-glow-blue);
		transition:
			transform var(--motion-base) var(--ease-spring),
			box-shadow var(--motion-base) ease;
	}
	.brand:hover .brand-icon {
		transform: rotate(-8deg) scale(1.08);
		box-shadow: 0 8px 24px rgba(124, 58, 237, 0.5);
	}

	.nav-links {
		display: flex;
		gap: 1.25rem;
		margin-right: auto;
	}
	.nav-links a {
		position: relative;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 600;
		padding-bottom: 2px;
		transition: color var(--motion-fast) ease;
	}
	.nav-links a::after {
		content: '';
		position: absolute;
		left: 0;
		right: 100%;
		bottom: -4px;
		height: 2px;
		border-radius: 2px;
		background: var(--gradient-volt);
		transition: right var(--motion-base) var(--ease-out);
	}
	.nav-links a:hover {
		color: var(--text-primary);
	}
	.nav-links a:hover::after {
		right: 0;
	}
	.admin-link {
		color: var(--accent-volt) !important;
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-left: auto;
	}
	.user-chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.user-avatar {
		width: 26px;
		height: 26px;
		border-radius: 999px;
		object-fit: cover;
		flex-shrink: 0;
	}
	.user-avatar-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-accent);
		color: white;
		font-size: 0.7rem;
		font-weight: 800;
	}
	.user-email {
		font-size: 0.8rem;
		color: var(--text-faint);
	}

	.content {
		flex: 1;
	}

	@media (max-width: 700px) {
		.topnav {
			flex-wrap: wrap;
			padding: 1rem;
		}
		.nav-links {
			order: 3;
			width: 100%;
			margin-right: 0;
			justify-content: space-between;
		}
	}
</style>
