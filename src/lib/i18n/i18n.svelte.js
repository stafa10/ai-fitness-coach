import { getContext, setContext } from 'svelte';
import { translations } from './translations.js';
import { DEFAULT_LOCALE, LOCALE_DIR, isSupportedLocale } from './locales.js';

const CONTEXT_KEY = Symbol('i18n');

function lookup(dict, path) {
	return path
		.split('.')
		.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
}

export function createI18nContext(initialLocale) {
	const state = $state({ code: isSupportedLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE });

	const ctx = {
		get locale() {
			return state.code;
		},
		setLocale(code) {
			if (!isSupportedLocale(code)) return;
			state.code = code;
			if (typeof document !== 'undefined') {
				document.cookie = `locale=${code}; path=/; max-age=31536000; samesite=lax`;
				document.documentElement.lang = code;
				document.documentElement.dir = LOCALE_DIR[code] ?? 'ltr';
			}
		},
		t(key, params) {
			const dict = translations[state.code] ?? translations[DEFAULT_LOCALE];
			let value = lookup(dict, key);
			if (value === undefined) value = lookup(translations[DEFAULT_LOCALE], key);
			if (value === undefined) return key;
			if (typeof value === 'string' && params) {
				for (const [k, v] of Object.entries(params)) {
					value = value.replaceAll(`{${k}}`, String(v));
				}
			}
			return value;
		},
		// Translates a stored English enum value (e.g. profile.goal === 'Weight Loss')
		// by camelCasing it into a lookup key (enums.goal.weightLoss). Falls back to the
		// raw stored value so untranslated locales/categories still render something.
		tEnum(category, value) {
			if (!value) return value;
			const key = value
				.split(' ')
				.map((w, i) =>
					i === 0 ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1)
				)
				.join('')
				.replace(/[^a-zA-Z0-9]/g, '');
			const dict = translations[state.code] ?? translations[DEFAULT_LOCALE];
			const translated = lookup(dict, `enums.${category}.${key}`);
			return translated !== undefined ? translated : value;
		}
	};

	setContext(CONTEXT_KEY, ctx);
	return ctx;
}

export function getI18n() {
	const ctx = getContext(CONTEXT_KEY);
	if (!ctx)
		throw new Error('getI18n() called outside of an i18n context — is the root layout mounted?');
	return ctx;
}
