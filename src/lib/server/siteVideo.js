import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const VIDEO_DIR = path.join('static', 'uploads', 'site');
const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB
const VIDEO_EXT_BY_MIME = {
	'video/mp4': 'mp4',
	'video/webm': 'webm',
	'video/quicktime': 'mov',
	'video/x-matroska': 'mkv'
};

export async function saveSiteVideo(file) {
	if (!VIDEO_EXT_BY_MIME[file.type]) {
		throw new Error('Video must be MP4, WebM, MOV or MKV.');
	}
	if (file.size > MAX_VIDEO_BYTES) {
		throw new Error('Video must be under 300MB.');
	}

	const filename = `${randomUUID()}.${VIDEO_EXT_BY_MIME[file.type]}`;
	await mkdir(VIDEO_DIR, { recursive: true });
	await writeFile(path.join(VIDEO_DIR, filename), Buffer.from(await file.arrayBuffer()));
	return `/uploads/site/${filename}`;
}
