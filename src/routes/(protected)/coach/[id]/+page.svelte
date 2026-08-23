<script>
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();

	function mapMessages(list) {
		return (list ?? []).map((m) => ({ role: m.role, content: m.content }));
	}

	let activeId = $state(data.conversation.id);
	let messages = $state(mapMessages(data.messages));
	let conversations = $state((data.conversations ?? []).map((c) => ({ ...c })));
	let input = $state('');
	let sending = $state(false);
	let sidebarOpen = $state(false);
	let scrollEl = $state(null);

	// Reset local chat state whenever the route navigates to a different conversation.
	// A reply still streaming for the conversation we're leaving keeps running in the
	// background (guarded by `stillHere()` in send()) but no longer touches this view.
	$effect(() => {
		if (data.conversation.id !== activeId) {
			activeId = data.conversation.id;
			messages = mapMessages(data.messages);
			conversations = (data.conversations ?? []).map((c) => ({ ...c }));
			sending = false;
		}
	});

	const suggestions = [
		{ icon: 'dumbbell', text: 'Build me a 4-day workout split' },
		{ icon: 'flame', text: 'What should I eat to hit my protein target?' },
		{ icon: 'target', text: 'How do I fix my squat form?' },
		{ icon: 'chart', text: 'Am I training enough for my goal?' }
	];

	let composerEl = $state(null);

	function autoGrow(e) {
		const el = e.currentTarget;
		el.style.height = 'auto';
		el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
	}

	function onComposerKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
			if (composerEl) composerEl.style.height = 'auto';
		}
	}

	function formatDate(iso) {
		const d = new Date(iso);
		const today = new Date();
		const isToday = d.toDateString() === today.toDateString();
		if (isToday) return d.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
		return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
	}

	async function scrollToBottom() {
		await tick();
		scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
	}

	async function send(text) {
		const message = (text ?? input).trim();
		if (!message || sending) return;

		const conversationIdAtSend = activeId;
		const stillHere = () => activeId === conversationIdAtSend;

		input = '';
		if (composerEl) composerEl.style.height = 'auto';
		messages = [
			...messages,
			{ role: 'user', content: message },
			{ role: 'assistant', content: '' }
		];
		sending = true;
		scrollToBottom();

		try {
			const res = await fetch(`/coach/${conversationIdAtSend}/send`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message })
			});

			if (!res.ok || !res.body) {
				if (stillHere())
					messages[messages.length - 1].content = 'Something went wrong — try again.';
				return;
			}

			const titleHeader = res.headers.get('X-Conversation-Title');
			if (titleHeader) {
				const title = decodeURIComponent(titleHeader);
				const idx = conversations.findIndex((c) => c.id === conversationIdAtSend);
				if (idx !== -1 && conversations[idx].title !== title) {
					const updated = { ...conversations[idx], title };
					conversations = [updated, ...conversations.filter((_, i) => i !== idx)];
				}
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (!stillHere()) continue;
				messages[messages.length - 1].content += decoder.decode(value, { stream: true });
				messages = messages;
				scrollToBottom();
			}
		} catch {
			if (stillHere()) messages[messages.length - 1].content = 'Something went wrong — try again.';
		} finally {
			if (stillHere()) sending = false;
		}
	}

	function onSubmit(e) {
		e.preventDefault();
		send();
	}

	async function newChat() {
		const res = await fetch('/coach/new', { method: 'POST' });
		if (!res.ok) return;
		const created = await res.json();
		conversations = [
			{ id: created.id, title: created.title, updatedAt: new Date().toISOString() },
			...conversations
		];
		sidebarOpen = false;
		goto(resolve('/coach/[id]', { id: String(created.id) }));
	}

	async function deleteConversation(id, event) {
		event.stopPropagation();
		event.preventDefault();
		if (!confirm("Delete this conversation? This can't be undone.")) return;

		const res = await fetch(`/coach/${id}/delete`, { method: 'POST' });
		if (!res.ok) return;

		const remaining = conversations.filter((c) => c.id !== id);
		conversations = remaining;

		if (id === activeId) {
			if (remaining.length > 0) {
				goto(resolve('/coach/[id]', { id: String(remaining[0].id) }));
			} else {
				await newChat();
			}
		}
	}
</script>

<svelte:head>
	<title>AI Coach | AI Fitness Coach</title>
</svelte:head>

<div class="page motion-in">
	<aside class="sidebar" class:open={sidebarOpen}>
		<Button variant="primary" full onclick={newChat}>
			<Icon name="plus" size={15} /> New Chat
		</Button>

		<div class="sidebar-label">
			<span>Conversations</span>
			<span class="sidebar-count">{conversations.length}</span>
		</div>

		<div class="conv-list">
			{#each conversations as c (c.id)}
				<a
					href={resolve('/coach/[id]', { id: String(c.id) })}
					class="conv-item {c.id === activeId ? 'active' : ''}"
					onclick={() => (sidebarOpen = false)}
				>
					<span class="conv-accent"></span>
					<Icon name="chat" size={15} />
					<div class="conv-meta">
						<span class="conv-title">{c.title}</span>
						<span class="conv-date">{formatDate(c.updatedAt)}</span>
					</div>
					<button
						class="conv-delete"
						onclick={(e) => deleteConversation(c.id, e)}
						aria-label="Delete conversation"
					>
						<Icon name="trash" size={13} />
					</button>
				</a>
			{/each}
		</div>
	</aside>

	<div class="chat-shell">
		<div class="chat-header">
			<button
				class="menu-btn"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				aria-label="Toggle history"
			>
				<Icon name="menu" size={18} />
			</button>
			<div class="header-icon"><Icon name="sparkle" size={20} /></div>
			<div>
				<h1>AI Coach</h1>
				<p>
					<span class="status-dot"></span> Ask about training, form, or nutrition — tailored to your profile.
				</p>
			</div>
		</div>

		<div class="messages" bind:this={scrollEl}>
			{#if messages.length === 0}
				<div class="empty">
					<div class="empty-icon"><Icon name="sparkle" size={28} /></div>
					<h2>What are we working on today?</h2>
					<p class="empty-sub">Pick a starting point, or just type below.</p>
					<div class="suggestions">
						{#each suggestions as s, i (s.text)}
							<button
								class="suggestion"
								style="--suggestion-accent: {[
									'var(--accent-blue)',
									'var(--accent-purple)',
									'var(--accent-teal)',
									'var(--accent-volt)'
								][i % 4]}"
								onclick={() => send(s.text)}
							>
								<span class="suggestion-icon"><Icon name={s.icon} size={15} /></span>
								{s.text}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				{#each messages as m, i (i)}
					<div class="message {m.role}">
						<div class="avatar">
							<Icon name={m.role === 'user' ? 'user' : 'sparkle'} size={14} />
						</div>
						<div class="bubble">
							{#if m.role === 'assistant' && m.content === '' && sending && i === messages.length - 1}
								<span class="typing"><span></span><span></span><span></span></span>
							{:else}
								{m.content}
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<form class="composer" onsubmit={onSubmit}>
			<textarea
				bind:this={composerEl}
				bind:value={input}
				rows="1"
				placeholder="Ask your coach anything..."
				disabled={sending}
				oninput={autoGrow}
				onkeydown={onComposerKeydown}></textarea>
			<Button type="submit" variant="primary" disabled={sending || !input.trim()}>
				<Icon name="send" size={16} />
			</Button>
		</form>
	</div>
</div>

<style>
	.page {
		position: relative;
		display: flex;
		height: calc(100vh - 65px);
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem;
		gap: 1rem;
		isolation: isolate;
		overflow: hidden;
	}
	.page::before,
	.page::after {
		content: '';
		position: absolute;
		width: 420px;
		height: 420px;
		border-radius: 999px;
		filter: blur(110px);
		opacity: 0.28;
		z-index: -1;
		pointer-events: none;
	}
	.page::before {
		top: -120px;
		left: -80px;
		background: var(--accent-blue);
	}
	.page::after {
		bottom: -140px;
		right: -100px;
		background: var(--accent-purple);
	}

	.sidebar {
		width: 260px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		background: color-mix(in srgb, var(--bg-panel) 78%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 1rem;
		overflow: hidden;
		box-shadow: var(--shadow-panel);
	}
	.sidebar-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.2rem;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1.2px;
		color: var(--text-faint);
	}
	.sidebar-count {
		background: color-mix(in srgb, var(--accent-blue) 18%, transparent);
		color: var(--accent-blue);
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		font-weight: 700;
	}
	.conv-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.conv-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.7rem;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.82rem;
		transition: 0.15s;
		position: relative;
		border: 1px solid transparent;
	}
	.conv-item:hover {
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-primary);
	}
	.conv-item.active {
		background: color-mix(in srgb, var(--accent-blue) 14%, transparent);
		border-color: color-mix(in srgb, var(--accent-blue) 30%, transparent);
		color: var(--text-primary);
	}
	.conv-accent {
		position: absolute;
		left: 0;
		top: 8px;
		bottom: 8px;
		width: 3px;
		border-radius: 999px;
		background: var(--gradient-accent);
		opacity: 0;
		transition: opacity 0.15s ease;
	}
	.conv-item.active .conv-accent {
		opacity: 1;
	}
	.conv-item :global(svg) {
		flex-shrink: 0;
		opacity: 0.7;
	}
	.conv-meta {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.conv-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 600;
	}
	.conv-date {
		font-size: 0.68rem;
		color: var(--text-faint);
	}
	.conv-delete {
		flex-shrink: 0;
		background: none;
		border: none;
		color: var(--text-faint);
		padding: 0.3rem;
		border-radius: 6px;
		display: flex;
		align-items: center;
		opacity: 0;
		cursor: pointer;
		transition: 0.15s;
	}
	.conv-item:hover .conv-delete {
		opacity: 1;
	}
	.conv-delete:hover {
		background: rgba(239, 68, 68, 0.15);
		color: var(--accent-red);
	}

	.chat-shell {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-panel);
		overflow: hidden;
	}
	.chat-header {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 1.2rem 1.6rem;
		border-bottom: 1px solid var(--border-subtle);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--accent-blue) 6%, transparent),
			transparent
		);
	}
	.menu-btn {
		display: none;
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 0.4rem;
		border-radius: 8px;
		cursor: pointer;
	}
	.header-icon {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-accent);
		box-shadow: var(--shadow-glow-blue);
		flex-shrink: 0;
	}
	.chat-header h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: -0.3px;
	}
	.chat-header p {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0.15rem 0 0;
		font-size: 0.82rem;
		color: var(--text-muted);
	}
	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: var(--accent-green);
		box-shadow: 0 0 8px var(--accent-green);
		flex-shrink: 0;
	}
	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	.empty {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;
		padding: 2rem 0;
	}
	.empty-icon {
		width: 64px;
		height: 64px;
		border-radius: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--gradient-accent);
		box-shadow:
			var(--shadow-glow-blue),
			0 0 0 8px color-mix(in srgb, var(--accent-blue) 10%, transparent);
	}
	.empty h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.empty-sub {
		margin: -0.6rem 0 0;
		font-size: 0.85rem;
		color: var(--text-faint);
	}
	.suggestions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
		margin-top: 0.5rem;
		max-width: 520px;
	}
	.suggestion {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.85rem 1rem;
		border-radius: var(--radius-md);
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition:
			transform var(--motion-base) var(--ease-out),
			border-color var(--motion-fast) ease,
			box-shadow var(--motion-base) var(--ease-out);
	}
	.suggestion-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 9px;
		flex-shrink: 0;
		background: color-mix(in srgb, var(--suggestion-accent, var(--accent-blue)) 16%, transparent);
		color: var(--suggestion-accent, var(--accent-blue));
	}
	.suggestion:hover {
		transform: translateY(-2px);
		border-color: color-mix(
			in srgb,
			var(--suggestion-accent, var(--accent-blue)) 50%,
			var(--border-strong)
		);
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
	}

	.message {
		display: flex;
		gap: 0.6rem;
		align-items: flex-start;
	}
	.message.user {
		flex-direction: row-reverse;
	}
	.avatar {
		width: 30px;
		height: 30px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--accent-volt);
	}
	.message.user .avatar {
		background: var(--gradient-accent);
		color: white;
		border: none;
		box-shadow: var(--shadow-glow-blue);
	}
	.bubble {
		max-width: 75%;
		padding: 0.8rem 1.1rem;
		border-radius: var(--radius-md) var(--radius-md) var(--radius-md) 4px;
		font-size: 0.9rem;
		line-height: 1.6;
		white-space: pre-wrap;
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}
	.message.user .bubble {
		background: var(--gradient-accent);
		border: none;
		border-radius: var(--radius-md) var(--radius-md) 4px var(--radius-md);
		color: white;
		box-shadow: var(--shadow-glow-blue);
	}
	.typing {
		display: inline-flex;
		gap: 4px;
		align-items: center;
		height: 1em;
	}
	.typing span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-faint);
		animation: bounce 1.2s infinite ease-in-out;
	}
	.typing span:nth-child(2) {
		animation-delay: 0.15s;
	}
	.typing span:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		40% {
			transform: translateY(-4px);
			opacity: 1;
		}
	}

	.composer {
		display: flex;
		align-items: flex-end;
		gap: 0.6rem;
		padding: 1rem 1.5rem 1.25rem;
		border-top: 1px solid var(--border-subtle);
	}
	.composer textarea {
		flex: 1;
		resize: none;
		max-height: 160px;
		padding: 0.85rem 1.1rem;
		border-radius: 22px;
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		line-height: 1.4;
		outline: none;
		transition:
			border-color var(--motion-fast) ease,
			box-shadow var(--motion-fast) ease;
	}
	.composer textarea:focus {
		border-color: var(--accent-blue);
		box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
	}
	.composer :global(.btn) {
		width: 44px;
		height: 44px;
		padding: 0;
		border-radius: 999px;
		flex-shrink: 0;
	}

	@media (max-width: 900px) {
		.page {
			padding: 0;
			position: relative;
		}
		.sidebar {
			position: absolute;
			inset: 0 auto 0 0;
			z-index: 20;
			width: 260px;
			border-radius: 0;
			transform: translateX(-100%);
			transition: transform 0.25s ease;
		}
		.sidebar.open {
			transform: translateX(0);
			box-shadow: 20px 0 40px rgba(0, 0, 0, 0.4);
		}
		.chat-shell {
			border-radius: 0;
			border-left: none;
			border-right: none;
		}
		.menu-btn {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.suggestions {
			grid-template-columns: 1fr;
		}
		.bubble {
			max-width: 85%;
		}
	}
</style>
