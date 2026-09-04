// Shared calorie/macro target calculation (Mifflin-St Jeor BMR + activity multiplier +
// goal adjustment), with an optional manual override. Used by both the dashboard's
// nutrition panel and the nutrition/food-diary page so the target never drifts between them.
export function computeNutritionTargets(profile) {
	if (!profile) return null;

	const bmr =
		10 * Number(profile.weight) +
		6.25 * Number(profile.height) -
		5 * profile.age +
		(profile.gender === 'Female' ? -161 : 5);

	const activityMultiplier =
		{
			Sedentary: 1.2,
			'Lightly Active': 1.375,
			'Moderately Active': 1.55,
			'Very Active': 1.725
		}[profile.activityLevel] ?? 1.2;

	let calculatedCalories = Math.round(bmr * activityMultiplier);

	if (profile.goal === 'Weight Loss') calculatedCalories -= 500;
	if (profile.goal === 'Muscle Gain') calculatedCalories += 300;
	if (profile.goal === 'Strength Building') calculatedCalories += 200;

	const calories = profile.customCalorieTarget || calculatedCalories;

	let protein;
	if (profile.goal === 'Weight Loss') protein = Math.round(Number(profile.weight) * 2.4);
	else if (profile.goal === 'Muscle Gain') protein = Math.round(Number(profile.weight) * 2.2);
	else protein = Math.round(Number(profile.weight) * 2);

	const fats = Math.round((calories * 0.25) / 9);
	const carbs = Math.round((calories - protein * 4 - fats * 9) / 4);

	return {
		calories,
		calculatedCalories,
		protein,
		carbs,
		fats,
		isCustom: Boolean(profile.customCalorieTarget)
	};
}
