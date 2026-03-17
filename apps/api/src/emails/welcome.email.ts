import { sendEmail } from '../services/email.service.js';
import { escapeHtml } from '../lib/escape-html.js';
import type { WelcomeEmailJobData } from '@myapp/types';

export async function sendWelcomeEmail(data: WelcomeEmailJobData) {
  await sendEmail({
    to: data.email,
    subject: 'Welcome to MyApp',
    html: `
      <h1>Welcome, ${escapeHtml(data.displayName)}!</h1>
      <p>Thank you for joining MyApp. We're excited to have you on board.</p>
      <p>Get started by exploring the app.</p>
    `,
  });
}
