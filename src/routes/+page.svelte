<script>
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { getI18n } from '$lib/i18n/i18n.svelte.js';

	let { data } = $props();
	const user = $derived(data?.user ?? null);
	const heroVideoUrl = $derived(data?.heroVideoUrl ?? null);

	const i18n = getI18n();
	const t = i18n.t;

	const features = $derived([
		{ icon: 'sparkle', title: t('home.feature1Title'), text: t('home.feature1Text') },
		{ icon: 'target', title: t('home.feature2Title'), text: t('home.feature2Text') },
		{ icon: 'chart', title: t('home.feature3Title'), text: t('home.feature3Text') },
		{ icon: 'flame', title: t('home.feature4Title'), text: t('home.feature4Text') }
	]);

	const steps = $derived([
		{ icon: 'user', title: t('home.step1Title'), text: t('home.step1Text') },
		{ icon: 'calendar', title: t('home.step2Title'), text: t('home.step2Text') },
		{ icon: 'chart', title: t('home.step3Title'), text: t('home.step3Text') },
		{ icon: 'sparkle', title: t('home.step4Title'), text: t('home.step4Text') }
	]);
</script>

<svelte:head>
	<title>AI Fitness Coach</title>
</svelte:head>

<section class="hero motion-in">
	<div class="hero-bg" aria-hidden="true">
		{#if heroVideoUrl}
			<video src={heroVideoUrl} autoplay muted loop playsinline></video>
		{/if}
		<div class="hero-blob b1"></div>
		<div class="hero-blob b2"></div>
		<div class="hero-blob b3"></div>
		<div class="hero-bg-overlay"></div>
	</div>

	<div class="badge">
		<Icon name="sparkle" size={13} />
		{t('home.badge')}
	</div>
	<h1>
		{t('home.heroLine1')}<br />
		<span class="highlight">{t('home.heroLine2')}</span>
	</h1>
	<p class="lead">
		{t('home.lead')}
	</p>
	<div class="hero-actions">
		{#if user}
			<Button href="/dashboard" variant="primary" size="lg">
				<Icon name="home" size={16} />
				{t('home.goDashboard')}
			</Button>
		{:else}
			<Button href="/auth/register" variant="primary" size="lg">
				{t('home.getStarted')}
				<Icon name="arrowRight" size={16} />
			</Button>
			<Button href="/auth/login" variant="ghost" size="lg">{t('home.signIn')}</Button>
		{/if}
	</div>
	<p class="hero-note">{t('home.heroNote')}</p>
</section>

<section class="features">
	{#each features as f, i (f.title)}
		<div class="motion-in" style="animation-delay: {i * 80}ms">
			<Card accent="var(--accent-blue)">
				<div class="feature-icon"><Icon name={f.icon} size={20} /></div>
				<h3>{f.title}</h3>
				<p>{f.text}</p>
			</Card>
		</div>
	{/each}
</section>

<section class="steps">
	<div class="steps-head">
		<span class="eyebrow">{t('home.howItWorksEyebrow')}</span>
		<h2>{t('home.howItWorksTitle')}</h2>
	</div>
	<div class="steps-grid">
		{#each steps as s, i (s.title)}
			<div class="step motion-in" style="animation-delay: {i * 90}ms">
				<div class="step-num">{i + 1}</div>
				<div class="step-icon"><Icon name={s.icon} size={18} /></div>
				<h3>{s.title}</h3>
				<p>{s.text}</p>
			</div>
		{/each}
	</div>
</section>

<section class="cta-band motion-in">
	<div class="cta-glow"></div>
	<Icon name="sparkle" size={22} />
	<h2>{t('home.ctaTitle')}</h2>
	<p>{t('home.ctaText')}</p>
	{#if user}
		<Button href="/dashboard" variant="primary" size="lg">{t('home.ctaButtonAuth')}</Button>
	{:else}
		<Button href="/auth/register" variant="primary" size="lg">{t('home.ctaButton')}</Button>
	{/if}
</section>

<footer class="footer">
	<div class="footer-brand">
		<Icon name="dumbbell" size={14} /> AI Fitness Coach
	</div>
	<p>{t('home.footerTagline')}</p>
</footer>

<style>
	section {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.hero {
		position: relative;
		max-width: 760px;
		padding: 5rem 2rem 3rem;
		text-align: center;
		isolation: isolate;
	}
	.hero-bg {
		position: absolute;
		top: -15%;
		bottom: -15%;
		left: 50%;
		width: 100vw;
		transform: translateX(-50%);
		z-index: -2;
		pointer-events: none;
		overflow: hidden;
	}
	.hero-bg video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.4;
	}
	.hero-bg-overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse at 50% 30%,
			transparent 0%,
			color-mix(in srgb, var(--bg-deep) 70%, transparent) 55%,
			var(--bg-deep) 100%
		);
	}
	.hero-blob {
		position: absolute;
		border-radius: 999px;
		filter: blur(90px);
		opacity: 0.45;
		animation: hero-drift 16s ease-in-out infinite;
	}
	.hero-blob.b1 {
		width: 420px;
		height: 420px;
		background: var(--accent-blue);
		top: 5%;
		left: 12%;
	}
	.hero-blob.b2 {
		width: 380px;
		height: 380px;
		background: var(--accent-purple);
		top: 15%;
		right: 8%;
		animation-delay: -5s;
	}
	.hero-blob.b3 {
		width: 320px;
		height: 320px;
		background: var(--accent-teal);
		bottom: 0;
		left: 38%;
		opacity: 0.3;
		animation-delay: -10s;
	}
	@keyframes hero-drift {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(30px, -24px) scale(1.1);
		}
		66% {
			transform: translate(-24px, 18px) scale(0.94);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.hero-blob {
			animation: none;
		}
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.9rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--accent-blue) 16%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent-blue) 35%, transparent);
		color: #d8b4fe;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.3px;
		margin-bottom: 1.5rem;
	}
	h1 {
		font-size: 2.6rem;
		font-weight: 700;
		letter-spacing: -1.2px;
		margin: 0 0 1.2rem;
		line-height: 1.15;
	}
	.highlight {
		background: var(--gradient-accent);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.lead {
		font-size: 1.05rem;
		color: var(--text-muted);
		margin: 0 0 2rem;
		line-height: 1.6;
	}
	.hero-actions {
		display: flex;
		justify-content: center;
		gap: 0.9rem;
		flex-wrap: wrap;
	}
	.hero-note {
		margin-top: 1.2rem;
		font-size: 0.78rem;
		color: var(--text-faint);
	}

	.features {
		padding: 1rem 2rem 5rem;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.1rem;
	}
	.feature-icon {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--accent-blue) 16%, transparent);
		color: var(--accent-volt);
		margin-bottom: 1rem;
	}
	.features h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
		font-weight: 700;
	}
	.features p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-muted);
		line-height: 1.5;
	}

	.steps {
		padding: 2rem 2rem 5rem;
	}
	.steps-head {
		text-align: center;
		margin-bottom: 2.5rem;
	}
	.eyebrow {
		display: block;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--accent-volt);
		margin-bottom: 0.6rem;
	}
	.steps-head h2 {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.5px;
	}
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
	}
	.step {
		position: relative;
		padding: 1.5rem 1.2rem;
		border-radius: var(--radius-lg);
		background: var(--bg-panel);
		border: 1px solid var(--border-subtle);
		transition:
			transform var(--motion-base) var(--ease-out),
			border-color var(--motion-base) ease;
	}
	.step:hover {
		transform: translateY(-4px);
		border-color: var(--accent-blue);
	}
	.step-num {
		position: absolute;
		top: -14px;
		right: 1rem;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: var(--gradient-volt);
		color: var(--bg-deep);
		font-weight: 800;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.step-icon {
		width: 38px;
		height: 38px;
		border-radius: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--accent-blue) 16%, transparent);
		color: var(--accent-blue);
		margin-bottom: 1rem;
	}
	.step h3 {
		font-size: 0.95rem;
		font-weight: 700;
		margin: 0 0 0.4rem;
	}
	.step p {
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
	}

	.cta-band {
		position: relative;
		max-width: 900px;
		margin: 0 auto 5rem;
		padding: 3.5rem 2rem;
		border-radius: var(--radius-xl);
		background: var(--bg-panel);
		border: 1px solid var(--border-subtle);
		text-align: center;
		overflow: hidden;
	}
	.cta-glow {
		position: absolute;
		inset: -40% -10% auto -10%;
		height: 220px;
		background: var(--gradient-accent);
		filter: blur(80px);
		opacity: 0.35;
		pointer-events: none;
	}
	.cta-band :global(svg) {
		color: var(--accent-volt);
		margin-bottom: 0.8rem;
		position: relative;
	}
	.cta-band h2 {
		font-size: 1.7rem;
		font-weight: 700;
		letter-spacing: -0.5px;
		margin: 0 0 0.6rem;
		position: relative;
	}
	.cta-band p {
		color: var(--text-muted);
		margin: 0 0 1.6rem;
		position: relative;
	}
	.cta-band :global(.btn) {
		position: relative;
	}

	.footer {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 2rem 3rem;
		text-align: center;
		border-top: 1px solid var(--border-subtle);
	}
	.footer-brand {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}
	.footer p {
		font-size: 0.8rem;
		color: var(--text-faint);
	}

	@media (max-width: 900px) {
		.features {
			grid-template-columns: 1fr 1fr;
		}
		.steps-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 600px) {
		.features {
			grid-template-columns: 1fr;
		}
		.steps-grid {
			grid-template-columns: 1fr;
		}
		h1 {
			font-size: 1.9rem;
		}
	}
</style>
