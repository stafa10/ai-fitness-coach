import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';

async function sendEmail({ to, subject, html, devUrl }) {
	if (!RESEND_API_KEY) {
		console.warn(
			`[email] RESEND_API_KEY not set — email not sent.\n  To: ${to}\n  Subject: ${subject}\n  Link: ${devUrl}`
		);
		return;
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ from: EMAIL_FROM, to, subject, html })
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Failed to send email (${res.status}): ${body}`);
	}
}

function emailShell(heading, message, buttonLabel, url) {
	return `
		<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
			<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#ec4899);margin-bottom:20px;"></div>
			<h1 style="font-size:20px;color:#0f172a;margin:0 0 12px;">${heading}</h1>
			<p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">${message}</p>
			<a href="${url}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">${buttonLabel}</a>
			<p style="font-size:12px;color:#94a3b8;margin-top:24px;">If the button doesn't work, copy and paste this link into your browser:<br />${url}</p>
		</div>
	`;
}

export async function sendVerificationEmail(to, url) {
	await sendEmail({
		to,
		subject: 'Verify your email — AI Fitness Coach',
		devUrl: url,
		html: emailShell(
			'Verify your email',
			'Confirm your email address to finish setting up your AI Fitness Coach account.',
			'Verify email',
			url
		)
	});
}

export async function sendResetPasswordEmail(to, url) {
	await sendEmail({
		to,
		subject: 'Reset your password — AI Fitness Coach',
		devUrl: url,
		html: emailShell(
			'Reset your password',
			"We received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
			'Reset password',
			url
		)
	});
}
