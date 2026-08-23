export function generateWorkout(profile) {
	const days = profile.workoutDays || 3;
	const goal = profile.goal || 'General Fitness';
	const level = profile.experience || 'Beginner';

	// Rep ranges based on goal
	const repRange = {
		'Muscle Gain': { compound: '6-10', isolation: '10-15' },
		'Strength Building': { compound: '3-6', isolation: '6-10' },
		'Weight Loss': { compound: '12-15', isolation: '15-20' },
		'General Fitness': { compound: '8-12', isolation: '12-15' }
	}[goal] ?? { compound: '8-12', isolation: '12-15' };

	// Sets based on experience
	const sets = {
		Beginner: { compound: 3, isolation: 2 },
		Intermediate: { compound: 4, isolation: 3 },
		Advanced: { compound: 5, isolation: 4 }
	}[level] ?? { compound: 3, isolation: 2 };

	const ex = (name, type = 'compound', rest = null) => ({
		name,
		sets: type === 'compound' ? sets.compound : sets.isolation,
		reps: type === 'compound' ? repRange.compound : repRange.isolation,
		rest: rest ?? (type === 'compound' ? 120 : 60)
	});

	const workoutMap = {
		1: [
			{
				day: 1,
				title: 'Full Body',
				cardio: '10 min warm-up',
				notes: 'Rest 90–120 sec between sets. Focus on form.',
				exercises: [
					ex('Squat'),
					ex('Bench Press'),
					ex('Lat Pulldown'),
					ex('Shoulder Press'),
					ex('Romanian Deadlift'),
					ex('Plank', 'isolation', 60)
				]
			}
		],

		2: [
			{
				day: 1,
				title: 'Upper Body',
				cardio: null,
				notes: 'Rest 90 sec on compounds, 60 sec on isolation.',
				exercises: [
					ex('Bench Press'),
					ex('Barbell Row'),
					ex('Shoulder Press'),
					ex('Lat Pulldown'),
					ex('Bicep Curl', 'isolation'),
					ex('Tricep Pushdown', 'isolation')
				]
			},
			{
				day: 2,
				title: 'Lower Body',
				cardio: '5 min bike warm-up',
				notes: 'Rest 2 min on squats and deadlifts.',
				exercises: [
					ex('Squat'),
					ex('Romanian Deadlift'),
					ex('Leg Press'),
					ex('Leg Curl', 'isolation'),
					ex('Calf Raise', 'isolation'),
					ex('Plank', 'isolation', 60)
				]
			}
		],

		3: [
			{
				day: 1,
				title: 'Push',
				cardio: null,
				notes: 'Focus on chest and shoulder connection. Control the eccentric.',
				exercises: [
					ex('Bench Press'),
					ex('Incline DB Press'),
					ex('Shoulder Press'),
					ex('Lateral Raise', 'isolation'),
					ex('Tricep Pushdown', 'isolation'),
					ex('Overhead Tricep Extension', 'isolation')
				]
			},
			{
				day: 2,
				title: 'Pull',
				cardio: null,
				notes: 'Drive elbows back on rows. Full stretch on pulldowns.',
				exercises: [
					ex('Pull-ups'),
					ex('Barbell Row'),
					ex('Lat Pulldown'),
					ex('Face Pull', 'isolation'),
					ex('Barbell Curl', 'isolation'),
					ex('Hammer Curl', 'isolation')
				]
			},
			{
				day: 3,
				title: 'Legs',
				cardio: '10 min treadmill',
				notes: 'Squat deep. Rest 2 min between heavy sets.',
				exercises: [
					ex('Squat'),
					ex('Romanian Deadlift'),
					ex('Leg Press'),
					ex('Leg Curl', 'isolation'),
					ex('Calf Raise', 'isolation'),
					ex('Hanging Leg Raise', 'isolation')
				]
			}
		],

		4: [
			{
				day: 1,
				title: 'Upper A',
				cardio: null,
				notes: 'Heavy upper day. Rest 2 min on compounds.',
				exercises: [
					ex('Bench Press'),
					ex('Barbell Row'),
					ex('Shoulder Press'),
					ex('Lat Pulldown'),
					ex('Bicep Curl', 'isolation'),
					ex('Tricep Pushdown', 'isolation')
				]
			},
			{
				day: 2,
				title: 'Lower A',
				cardio: '5 min warm-up',
				notes: 'Prioritise squat depth and knee tracking.',
				exercises: [
					ex('Squat'),
					ex('Romanian Deadlift'),
					ex('Leg Press'),
					ex('Leg Curl', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			},
			{
				day: 3,
				title: 'Upper B',
				cardio: null,
				notes: 'Lighter upper day. Focus on contraction.',
				exercises: [
					ex('Incline DB Press'),
					ex('Cable Row'),
					ex('Lateral Raise', 'isolation'),
					ex('Rear Delt Fly', 'isolation'),
					ex('Hammer Curl', 'isolation'),
					ex('Skull Crusher', 'isolation')
				]
			},
			{
				day: 4,
				title: 'Lower B',
				cardio: '10 min treadmill',
				notes: 'Focus on quads and posterior chain.',
				exercises: [
					ex('Front Squat'),
					ex('Hip Thrust'),
					ex('Leg Extension', 'isolation'),
					ex('Hamstring Curl', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			}
		],

		5: [
			{
				day: 1,
				title: 'Push',
				cardio: null,
				notes: 'Rest 2 min on bench. 60 sec on isolation.',
				exercises: [
					ex('Bench Press'),
					ex('Incline DB Press'),
					ex('Shoulder Press'),
					ex('Lateral Raise', 'isolation'),
					ex('Tricep Pushdown', 'isolation')
				]
			},
			{
				day: 2,
				title: 'Pull',
				cardio: null,
				notes: 'Focus on scapular retraction throughout.',
				exercises: [
					ex('Pull-ups'),
					ex('Barbell Row'),
					ex('Lat Pulldown'),
					ex('Face Pull', 'isolation'),
					ex('Barbell Curl', 'isolation')
				]
			},
			{
				day: 3,
				title: 'Legs',
				cardio: '5 min bike',
				notes: 'Go heavy on squats. Control the descent.',
				exercises: [
					ex('Squat'),
					ex('Romanian Deadlift'),
					ex('Leg Press'),
					ex('Hamstring Curl', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			},
			{
				day: 4,
				title: 'Upper',
				cardio: null,
				notes: 'Volume day. Shorter rest, higher reps.',
				exercises: [
					ex('Incline Press'),
					ex('Cable Row'),
					ex('Machine Shoulder Press'),
					ex('Rear Delt Fly', 'isolation'),
					ex('Superset: Curl + Pushdown', 'isolation')
				]
			},
			{
				day: 5,
				title: 'Lower',
				cardio: '10 min treadmill',
				notes: 'Focus on unilateral movements for balance.',
				exercises: [
					ex('Front Squat'),
					ex('Walking Lunges'),
					ex('Leg Extension', 'isolation'),
					ex('Leg Curl', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			}
		],

		6: [
			{
				day: 1,
				title: 'Push',
				cardio: null,
				notes: 'Heavy chest day. Rest 2 min between compound sets.',
				exercises: [
					ex('Bench Press'),
					ex('Incline Press'),
					ex('Shoulder Press'),
					ex('Lateral Raise', 'isolation'),
					ex('Tricep Pushdown', 'isolation')
				]
			},
			{
				day: 2,
				title: 'Pull',
				cardio: null,
				notes: 'Deadlift first while fresh. Full ROM on rows.',
				exercises: [
					ex('Deadlift'),
					ex('Pull-ups'),
					ex('Barbell Row'),
					ex('Face Pull', 'isolation'),
					ex('Barbell Curl', 'isolation')
				]
			},
			{
				day: 3,
				title: 'Legs',
				cardio: '5 min warm-up',
				notes: 'High volume leg day. Stay hydrated.',
				exercises: [
					ex('Squat'),
					ex('Leg Press'),
					ex('Romanian Deadlift'),
					ex('Leg Curl', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			},
			{
				day: 4,
				title: 'Push B',
				cardio: null,
				notes: 'Machine-focused push day. Squeeze at the top.',
				exercises: [
					ex('Machine Chest Press'),
					ex('DB Incline Press'),
					ex('Arnold Press'),
					ex('Cable Flye', 'isolation'),
					ex('Overhead Tricep Extension', 'isolation')
				]
			},
			{
				day: 5,
				title: 'Pull B',
				cardio: null,
				notes: 'Focus on back width and bicep peak.',
				exercises: [
					ex('Lat Pulldown'),
					ex('Cable Row'),
					ex('Shrugs', 'isolation'),
					ex('Rear Delt Fly', 'isolation'),
					ex('Hammer Curl', 'isolation')
				]
			},
			{
				day: 6,
				title: 'Legs B',
				cardio: '10 min treadmill',
				notes: 'Lighter leg day. Focus on isolation and contraction.',
				exercises: [
					ex('Hack Squat'),
					ex('Bulgarian Split Squat'),
					ex('Leg Curl', 'isolation'),
					ex('Leg Extension', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			},
			{
				day: '-',
				title: 'Rest Day',
				cardio: null,
				notes: 'Full rest. Prioritise sleep, nutrition, and hydration.',
				exercises: [
					{ name: 'No training today', sets: 0, reps: '-', rest: 0 },
					{ name: 'Foam rolling recommended', sets: 0, reps: '-', rest: 0 },
					{ name: 'Stay hydrated', sets: 0, reps: '-', rest: 0 }
				]
			}
		],

		7: [
			{
				day: 1,
				title: 'Push',
				cardio: null,
				notes: 'Heavy push. Rest 2 min on bench and press.',
				exercises: [
					ex('Bench Press'),
					ex('Incline Press'),
					ex('Shoulder Press'),
					ex('Lateral Raise', 'isolation'),
					ex('Tricep Pushdown', 'isolation')
				]
			},
			{
				day: 2,
				title: 'Pull',
				cardio: null,
				notes: 'Pull-ups first. Control every rep.',
				exercises: [
					ex('Pull-ups'),
					ex('Barbell Row'),
					ex('Lat Pulldown'),
					ex('Rear Delt Fly', 'isolation'),
					ex('Barbell Curl', 'isolation')
				]
			},
			{
				day: 3,
				title: 'Legs',
				cardio: '5 min bike',
				notes: 'Prioritise squat depth. Take your time.',
				exercises: [
					ex('Squat'),
					ex('Romanian Deadlift'),
					ex('Leg Press'),
					ex('Leg Curl', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			},
			{
				day: 4,
				title: 'Upper',
				cardio: null,
				notes: 'Volume upper. Shorter rest, more reps.',
				exercises: [
					ex('Machine Chest Press'),
					ex('Cable Row'),
					ex('Shoulder Machine'),
					ex('Bicep Curl', 'isolation'),
					ex('Tricep Extension', 'isolation')
				]
			},
			{
				day: 5,
				title: 'Lower',
				cardio: '5 min treadmill',
				notes: 'Unilateral focus. Great for fixing imbalances.',
				exercises: [
					ex('Front Squat'),
					ex('Hip Thrust'),
					ex('Walking Lunges'),
					ex('Leg Curl', 'isolation'),
					ex('Calf Raise', 'isolation')
				]
			},
			{
				day: 6,
				title: 'Cardio & Core',
				cardio: '30 min steady state',
				notes: 'Low intensity cardio. Great for recovery and fat loss.',
				exercises: [
					{ name: 'Plank', sets: 3, reps: '45 sec', rest: 60 },
					{ name: 'Hanging Leg Raise', sets: 3, reps: '12-15', rest: 60 },
					{ name: 'Russian Twist', sets: 3, reps: '20', rest: 45 },
					{ name: 'Ab Wheel', sets: 3, reps: '10-12', rest: 60 },
					{ name: 'Stretching', sets: 1, reps: '10 min', rest: 0 }
				]
			},
			{
				day: 7,
				title: 'Recovery',
				cardio: null,
				notes: 'Active recovery. No heavy lifting today.',
				exercises: [
					{ name: 'Light Walk (20–30 min)', sets: 1, reps: '-', rest: 0 },
					{ name: 'Foam Rolling', sets: 1, reps: '10 min', rest: 0 },
					{ name: 'Full Body Stretch', sets: 1, reps: '10 min', rest: 0 },
					{ name: 'Hydration & Nutrition Focus', sets: 0, reps: '-', rest: 0 },
					{ name: 'Sleep 8+ hours', sets: 0, reps: '-', rest: 0 }
				]
			}
		]
	};

	return workoutMap[days] ?? [];
}
