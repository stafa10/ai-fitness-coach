export const PASSWORD_RULES = [
	{ key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
	{ key: 'lower', label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
	{ key: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
	{ key: 'number', label: 'One number', test: (p) => /[0-9]/.test(p) },
	{ key: 'symbol', label: 'One symbol (e.g. ! @ # $ %)', test: (p) => /[^A-Za-z0-9]/.test(p) }
];

export function passwordError(password) {
	const failed = PASSWORD_RULES.find((rule) => !rule.test(password ?? ''));
	return failed ? `Password needs: ${failed.label.toLowerCase()}.` : null;
}
