import { openai } from '$lib/server/openai.js';
import { generateWorkout } from '$lib/server/workoutGenerator.js';

const LANGUAGE_NAMES = {
	en: 'English',
	es: 'Spanish',
	fr: 'French',
	pt: 'Portuguese',
	ru: 'Russian',
	ar: 'Arabic',
	zh: 'Simplified Chinese',
	ja: 'Japanese',
	hi: 'Hindi',
	bn: 'Bengali'
};

const FALLBACK_DAY_TITLE = {
	en: 'Day',
	es: 'Día',
	fr: 'Jour',
	pt: 'Dia',
	ru: 'День',
	ar: 'اليوم',
	zh: '第',
	ja: '日目',
	hi: 'दिन',
	bn: 'দিন'
};

const FALLBACK_NOTES = {
	en: 'Focus on good form and controlled reps.',
	es: 'Concéntrate en la buena técnica y repeticiones controladas.',
	fr: 'Concentrez-vous sur une bonne technique et des répétitions contrôlées.',
	pt: 'Concentre-se na boa execução e em repetições controladas.',
	ru: 'Сосредоточьтесь на правильной технике и контролируемых повторениях.',
	ar: 'ركّز على الأداء الصحيح والتكرارات المتحكم بها.',
	zh: '注重正确的动作姿势和可控的重复次数。',
	ja: '正しいフォームとコントロールされたレップを意識しましょう。',
	hi: 'सही फॉर्म और नियंत्रित रेप्स पर ध्यान दें।',
	bn: 'সঠিক ফর্ম এবং নিয়ন্ত্রিত রেপসের ওপর মনোযোগ দিন।'
};

function buildPrompt(profile, trainingSummary, locale) {
	const days = profile.workoutDays || 3;
	const languageName = LANGUAGE_NAMES[locale] ?? LANGUAGE_NAMES.en;

	const trainingSection = trainingSummary
		? `\nTheir actual logged training history (this is real — use it to shape progression,\ndon't just repeat the profile):\n${trainingSummary}\n`
		: '';

	const languageInstruction =
		locale && locale !== 'en'
			? `\nWrite every piece of human-readable text in the response — day "title", "cardio", "notes", and\neach exercise "name" — in ${languageName}. Keep the JSON keys themselves in English exactly as\nspecified below.\n`
			: '';

	return `Design a ${days}-day-per-week workout split for this person:

- Age: ${profile.age}
- Gender: ${profile.gender || 'not specified'}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- Goal: ${profile.goal}
- Experience level: ${profile.experience}
- Equipment access: ${profile.equipmentAccess || 'not specified'}
- Injuries / limitations: ${profile.injuries || 'none reported'}
${trainingSection}${languageInstruction}
Rules:
- Produce exactly ${days} training day entries (day numbers 1 through ${days}), plus optionally
  one extra rest/recovery day entry with "day": "-" if it helps round out the week.
- Only prescribe exercises that fit their stated equipment access — never assume a full gym
  if they only have dumbbells, bands, or bodyweight.
- Take injuries/limitations seriously: never include an exercise that could aggravate a
  reported injury; substitute a safer alternative instead.
- Choose rep ranges and set counts appropriate to their goal and experience level.
- If their training history shows a lift has stalled across recent sessions (same or falling
  weight/reps for that exercise), don't just repeat the same prescription — adjust the rep
  range, add a variation, or note a deload/technique change in that day's notes.
- If their training history shows consistent progress or a strong streak, you can progress
  loading intent (e.g. push rep ranges toward the top end) and say so in the notes.
- If there's no meaningful training history yet, base the plan on the profile alone — don't
  invent progress that isn't there.
- Give each day a short descriptive title (e.g. "Push", "Full Body", "Legs").

Respond with ONLY a JSON object of this exact shape, no other text:
{
  "days": [
    {
      "day": 1,
      "title": "string",
      "cardio": "string or null",
      "notes": "one or two sentence coaching note for this day",
      "exercises": [
        { "name": "string", "sets": number, "reps": "string e.g. 8-12", "rest": number }
      ]
    }
  ]
}`;
}

function normalizeDay(raw, fallbackDay, locale) {
	if (!raw || typeof raw !== 'object') return null;
	const exercises = Array.isArray(raw.exercises) ? raw.exercises : [];
	if (exercises.length === 0) return null;

	const normalizedExercises = exercises
		.filter((ex) => ex && typeof ex.name === 'string' && ex.name.trim())
		.map((ex) => ({
			name: ex.name.trim(),
			sets: Number.isFinite(Number(ex.sets)) ? Math.max(0, Math.round(Number(ex.sets))) : 3,
			reps: ex.reps ? String(ex.reps) : '8-12',
			rest: Number.isFinite(Number(ex.rest)) ? Math.max(0, Math.round(Number(ex.rest))) : 60
		}));

	if (normalizedExercises.length === 0) return null;

	const fallbackTitleWord = FALLBACK_DAY_TITLE[locale] ?? FALLBACK_DAY_TITLE.en;
	const fallbackNotes = FALLBACK_NOTES[locale] ?? FALLBACK_NOTES.en;

	return {
		day: raw.day === '-' ? '-' : Number(raw.day) || fallbackDay,
		title:
			typeof raw.title === 'string' && raw.title.trim()
				? raw.title.trim()
				: `${fallbackTitleWord} ${fallbackDay}`,
		cardio: typeof raw.cardio === 'string' && raw.cardio.trim() ? raw.cardio.trim() : null,
		notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim() : fallbackNotes,
		exercises: normalizedExercises
	};
}

function normalizePlan(parsed, expectedDays, locale) {
	if (!parsed || !Array.isArray(parsed.days)) return null;

	const days = parsed.days.map((d, i) => normalizeDay(d, i + 1, locale)).filter(Boolean);
	const numberedDays = days.filter((d) => d.day !== '-');

	if (numberedDays.length === 0) return null;
	if (numberedDays.length > expectedDays + 1) return null;

	return days;
}

// Generates a workout plan via the LLM, grounded in the user's real profile (goal,
// experience, equipment, injuries) and, when available, their actual logged training
// history (trainingSummary from trainingSummary.js) so progression reflects real data
// instead of just the static profile. Falls back to the static template generator on any
// failure or malformed response, since this feeds a core, must-not-break dashboard panel.
// `locale` (an app locale code like 'es', 'ja') asks the model to write day titles, notes,
// and exercise names in that language — the static fallback generator stays English-only.
export async function generateWorkoutWithAI(profile, trainingSummary = null, locale = 'en') {
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-5.5',
			max_completion_tokens: 2000,
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content:
						'You are a certified strength coach generating structured workout plans. Respond with strict JSON only, matching the requested shape exactly.'
				},
				{ role: 'user', content: buildPrompt(profile, trainingSummary, locale) }
			]
		});

		const raw = completion.choices[0]?.message?.content;
		if (!raw) throw new Error('Empty AI response');

		const parsed = JSON.parse(raw);
		const plan = normalizePlan(parsed, profile.workoutDays || 3, locale);
		if (!plan) throw new Error('Malformed AI workout plan');

		return plan;
	} catch (err) {
		console.error('AI workout generation failed, falling back to static plan:', err);
		return generateWorkout(profile);
	}
}
