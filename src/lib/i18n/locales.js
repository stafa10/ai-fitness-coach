export const DEFAULT_LOCALE = 'en';

export const LOCALES = [
	{ code: 'en', name: 'English', dir: 'ltr' },
	{ code: 'zh', name: '中文', dir: 'ltr' },
	{ code: 'es', name: 'Español', dir: 'ltr' },
	{ code: 'hi', name: 'हिन्दी', dir: 'ltr' },
	{ code: 'ar', name: 'العربية', dir: 'rtl' },
	{ code: 'pt', name: 'Português', dir: 'ltr' },
	{ code: 'bn', name: 'বাংলা', dir: 'ltr' },
	{ code: 'ru', name: 'Русский', dir: 'ltr' },
	{ code: 'ja', name: '日本語', dir: 'ltr' },
	{ code: 'fr', name: 'Français', dir: 'ltr' }
];

export const SUPPORTED_LOCALES = LOCALES.map((l) => l.code);

export const LOCALE_DIR = Object.fromEntries(LOCALES.map((l) => [l.code, l.dir]));

export function isSupportedLocale(code) {
	return SUPPORTED_LOCALES.includes(code);
}
