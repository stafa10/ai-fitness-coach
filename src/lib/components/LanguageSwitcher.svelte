<script>
	import { getI18n } from '$lib/i18n/i18n.svelte.js';
	import { LOCALES } from '$lib/i18n/locales.js';

	const i18n = getI18n();
</script>

<select
	class="lang-switcher"
	value={i18n.locale}
	onchange={(e) => i18n.setLocale(e.currentTarget.value)}
	aria-label="Language"
>
	{#each LOCALES as locale (locale.code)}
		<option value={locale.code}>{locale.name}</option>
	{/each}
</select>

<style>
	.lang-switcher {
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		border-radius: var(--radius-sm);
		padding: 0.4rem 0.6rem;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		cursor: pointer;
		outline: none;
	}
	.lang-switcher:focus {
		border-color: var(--accent-blue);
	}
</style>
