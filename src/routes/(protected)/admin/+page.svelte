<script>
	import Icon from '$lib/components/Icon.svelte';

	let { data, form } = $props();
	const users = $derived(data?.users ?? []);
	const adminId = $derived(data?.adminId);
	const heroVideoUrl = $derived(data?.heroVideoUrl ?? null);
	let videoFileName = $state('');

	function formatDate(value) {
		return new Date(value).toLocaleDateString('en-IE', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Admin | AI Fitness Coach</title>
</svelte:head>

<div class="page motion-in">
	<div class="header">
		<div class="header-left">
			<div class="header-icon"><Icon name="shield" size={22} /></div>
			<div>
				<h1>Admin</h1>
				<p class="sub">{users.length} registered {users.length === 1 ? 'user' : 'users'}</p>
			</div>
		</div>
	</div>

	{#if form?.error}
		<div class="notice error"><Icon name="alert" size={16} /> {form.error}</div>
	{/if}
	{#if form?.videoError}
		<div class="notice error"><Icon name="alert" size={16} /> {form.videoError}</div>
	{/if}

	<div class="video-card">
		<div class="video-card-head">
			<div class="panel-icon"><Icon name="video" size={16} /></div>
			<div>
				<h2>Homepage Intro Video</h2>
				<p class="sub">Shown on the public landing page to encourage sign-ups.</p>
			</div>
		</div>

		<div class="video-card-body">
			{#if heroVideoUrl}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video class="video-preview" src={heroVideoUrl} controls preload="metadata"></video>
			{:else}
				<div class="video-empty">
					<Icon name="video" size={22} />
					<span>No intro video uploaded yet</span>
				</div>
			{/if}

			<div class="video-actions">
				<form method="POST" action="?/uploadHeroVideo" enctype="multipart/form-data">
					<label class="video-upload">
						<Icon name="video" size={14} />
						<span>{videoFileName || (heroVideoUrl ? 'Replace video' : 'Upload video')}</span>
						<input
							type="file"
							name="video"
							accept="video/*"
							class="video-input"
							onchange={(e) => {
								videoFileName = e.currentTarget.files?.[0]?.name ?? '';
								e.currentTarget.form.requestSubmit();
							}}
						/>
					</label>
				</form>
				{#if heroVideoUrl}
					<form
						method="POST"
						action="?/removeHeroVideo"
						onsubmit={(e) => {
							if (!confirm('Remove the homepage intro video?')) e.preventDefault();
						}}
					>
						<button type="submit" class="video-remove">
							<Icon name="trash" size={14} /> Remove
						</button>
					</form>
				{/if}
			</div>
			{#if form?.videoSuccess}
				<p class="video-status success"><Icon name="check" size={12} /> Video updated</p>
			{/if}
		</div>
	</div>

	<div class="table-card">
		<div class="table-scroll">
			<table>
				<thead>
					<tr>
						<th>User</th>
						<th>Joined</th>
						<th>Verified</th>
						<th>Profile</th>
						<th>Sessions</th>
						<th>Chats</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each users as u (u.id)}
						<tr>
							<td>
								<div class="user-cell">
									<span class="user-avatar">{u.name?.[0]?.toUpperCase() ?? '?'}</span>
									<div>
										<span class="user-name">{u.name}</span>
										<span class="user-email">{u.email}</span>
									</div>
								</div>
							</td>
							<td>{formatDate(u.createdAt)}</td>
							<td>
								{#if u.emailVerified}
									<span class="pill pill-good"><Icon name="check" size={11} /> Verified</span>
								{:else}
									<span class="pill pill-muted">Unverified</span>
								{/if}
							</td>
							<td>
								{#if u.hasProfile}
									<span class="pill pill-good">Yes</span>
								{:else}
									<span class="pill pill-muted">No</span>
								{/if}
							</td>
							<td>{u.sessionCount}</td>
							<td>{u.chatCount}</td>
							<td>
								{#if u.id === adminId}
									<span class="you-tag">You</span>
								{:else}
									<form
										method="POST"
										action="?/deleteUser"
										onsubmit={(e) => {
											if (
												!confirm(
													`Permanently delete ${u.email} and all of their data? This cannot be undone.`
												)
											)
												e.preventDefault();
										}}
									>
										<input type="hidden" name="userId" value={u.id} />
										<button type="submit" class="row-delete" aria-label="Delete {u.email}">
											<Icon name="trash" size={14} />
										</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.page {
		position: relative;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		isolation: isolate;
		overflow: hidden;
	}
	.page::before {
		content: '';
		position: absolute;
		top: -140px;
		right: -120px;
		width: 420px;
		height: 420px;
		border-radius: 999px;
		background: var(--accent-blue);
		filter: blur(120px);
		opacity: 0.22;
		z-index: -1;
		pointer-events: none;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.75rem;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}
	.header-icon {
		width: 48px;
		height: 48px;
		background: var(--gradient-accent);
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			var(--shadow-glow-blue),
			0 0 0 8px color-mix(in srgb, var(--accent-blue) 10%, transparent);
		flex-shrink: 0;
	}
	h1 {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.5px;
	}
	.sub {
		font-size: 0.82rem;
		color: var(--text-faint);
		margin: 0.15rem 0 0;
	}
	.notice {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
		padding: 0.9rem 1.2rem;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
	}
	.notice.error {
		background: rgba(244, 63, 94, 0.1);
		border: 1px solid rgba(244, 63, 94, 0.3);
		color: #fecdd3;
	}

	.video-card {
		position: relative;
		background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-panel);
		padding: 1.4rem;
		margin-bottom: 1.5rem;
		overflow: hidden;
	}
	.video-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-accent);
	}
	.video-card-head {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-bottom: 1.1rem;
	}
	.video-card-head h2 {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
	}
	.panel-icon {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: color-mix(in srgb, var(--accent-blue) 16%, transparent);
		color: var(--accent-blue);
	}
	.video-preview {
		width: 100%;
		max-height: 320px;
		border-radius: var(--radius-md);
		background: #000;
		display: block;
		margin-bottom: 1rem;
	}
	.video-empty {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1.4rem;
		border-radius: var(--radius-md);
		background: var(--bg-input);
		border: 1px dashed var(--border-strong);
		color: var(--text-faint);
		font-size: 0.88rem;
		margin-bottom: 1rem;
	}
	.video-actions {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.video-input {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		opacity: 0;
	}
	.video-upload {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1.1rem;
		border-radius: var(--radius-sm);
		background: var(--bg-input);
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: 0.2s;
	}
	.video-upload:hover {
		border-color: var(--accent-blue);
		color: var(--accent-blue);
	}
	.video-remove {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.7rem 1.1rem;
		border-radius: var(--radius-sm);
		background: none;
		border: 1px solid rgba(244, 63, 94, 0.3);
		color: var(--accent-red);
		font-size: 0.85rem;
		font-weight: 600;
		font-family: var(--font-sans);
		cursor: pointer;
		transition: 0.2s;
	}
	.video-remove:hover {
		background: rgba(244, 63, 94, 0.12);
	}
	.video-status {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0.8rem 0 0;
		font-size: 0.8rem;
		color: var(--accent-green);
	}

	.table-card {
		position: relative;
		background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
		backdrop-filter: blur(20px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-panel);
		overflow: hidden;
	}
	.table-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		height: 3px;
		background: var(--gradient-accent);
		z-index: 1;
	}
	.table-scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 720px;
	}
	thead th {
		text-align: left;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		font-weight: 700;
		color: var(--text-faint);
		padding: 1rem 1.2rem;
		border-bottom: 1px solid var(--border-subtle);
		background: rgba(255, 255, 255, 0.02);
	}
	tbody td {
		padding: 1rem 1.2rem;
		border-bottom: 1px solid var(--border-subtle);
		font-size: 0.88rem;
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tbody tr:hover {
		background: rgba(255, 255, 255, 0.02);
	}
	.user-cell {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}
	.user-avatar {
		width: 34px;
		height: 34px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: var(--gradient-accent);
		color: white;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.8rem;
	}
	.user-name {
		font-weight: 700;
		color: var(--text-primary);
	}
	.user-email {
		font-size: 0.76rem;
		color: var(--text-faint);
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
	}
	.pill-good {
		background: rgba(34, 197, 94, 0.12);
		color: var(--accent-green);
	}
	.pill-muted {
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-faint);
	}
	.you-tag {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-faint);
	}
	.row-delete {
		width: 34px;
		height: 34px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border-subtle);
		color: var(--text-faint);
		cursor: pointer;
		transition: 0.2s;
	}
	.row-delete:hover {
		background: rgba(239, 68, 68, 0.14);
		border-color: rgba(239, 68, 68, 0.4);
		color: var(--accent-red);
	}
</style>
