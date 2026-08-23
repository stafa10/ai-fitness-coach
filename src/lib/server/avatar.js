import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const AVATAR_DIR = path.join('static', 'uploads', 'avatars');
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const AVATAR_EXT_BY_MIME = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif'
};

export async function saveAvatar(file) {
	if (!AVATAR_EXT_BY_MIME[file.type]) {
		throw new Error('Photo must be a JPG, PNG, WEBP or GIF.');
	}
	if (file.size > MAX_AVATAR_BYTES) {
		throw new Error('Photo must be under 5MB.');
	}

	const filename = `${randomUUID()}.${AVATAR_EXT_BY_MIME[file.type]}`;
	await mkdir(AVATAR_DIR, { recursive: true });
	await writeFile(path.join(AVATAR_DIR, filename), Buffer.from(await file.arrayBuffer()));
	return `/uploads/avatars/${filename}`;
}
