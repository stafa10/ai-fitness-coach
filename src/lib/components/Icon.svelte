<script>
	let { name, size = 18, stroke = 2 } = $props();

	// Small curated set of stroke icons (Feather-style paths), one place to add more.
	const icons = {
		dumbbell:
			'M6.5 6.5 17.5 17.5 M5 8l3-3M3 10l3-3M19 16l-3 3M16 19l3-3M2.5 12l1.5-1.5M20 12l-1.5 1.5M8 5l1.8-1.8a2 2 0 0 1 2.9 0l.1.1M16 19l-1.8 1.8a2 2 0 0 1-2.9 0l-.1-.1',
		chart: 'M3 3v18h18 M7 15l4-6 3 3 5-8',
		home: 'M3 11l9-8 9 8 M5 10v10h14V10',
		user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6',
		logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
		login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l-5-5 5-5 M15 12H3',
		mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
		lock: 'M6 11V7a6 6 0 0 1 12 0v4 M5 11h14v10H5z',
		chevronLeft: 'M15 18l-6-6 6-6',
		send: 'M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7Z',
		plus: 'M12 5v14 M5 12h14',
		close: 'M18 6 6 18 M6 6l12 12',
		check: 'M20 6 9 17l-5-5',
		clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 6v6l4 2',
		flame:
			'M12 22c4 0 7-3 7-7 0-3-2-4-2-7 0 0-2 1-2 4 0-4-3-6-3-9 0 3-4 5-4 10 0 1-1 2-2 2 0 4 2 7 6 7Z',
		scale: 'M4 4h16 M12 4v4 M6 8h12l3 9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3l3-9Z',
		ruler: 'M3 8h18v8H3z M7 8v3 M11 8v3 M15 8v3 M19 8v3',
		shield: 'M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3Z',
		alert:
			'M12 9v4 M12 17h.01 M10.3 3.9 1.8 18a1 1 0 0 0 .9 1.5h18.6a1 1 0 0 0 .9-1.5L13.7 3.9a1 1 0 0 0-3.4 0Z',
		target:
			'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 12h.01',
		calendar: 'M3 5h18v16H3z M16 3v4 M8 3v4 M3 10h18',
		edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
		trash: 'M3 6h18 M8 6V4h8v2 M6 6l1 14h10l1-14',
		chat: 'M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
		menu: 'M3 6h18 M3 12h18 M3 18h18',
		print:
			'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
		sparkle:
			'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z M19 3l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z M5 15l.6 1.7L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.3L5 15Z',
		arrowRight: 'M5 12h14 M13 6l6 6-6 6',
		award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M8.21 13.89 7 23l5-3 5 3-1.21-9.12',
		pause: 'M6 4h4v16H6z M14 4h4v16h-4z',
		video:
			'M23 7l-7 5 7 5V7Z M14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z',
		play: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M10 8l6 4-6 4V8Z'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={icons[name] ?? ''} />
</svg>
