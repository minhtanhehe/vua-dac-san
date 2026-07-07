import nodemailer from 'nodemailer';
import 'dotenv/config';

const mailHost = process.env.MAIL_HOST;
const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

let transporter;

if (mailHost && mailUser && mailPass) {
  transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailPort === 465,
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });
  console.log(`Nodemailer SMTP Transporter initialized to: ${mailHost}:${mailPort}`);
} else {
  console.log('Nodemailer: SMTP configuration missing or incomplete. Falling back to Console Logger mode.');
}

export async function sendEmail({ to, subject, html, text }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Vua Đặc Sản" <${mailUser}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`[Email Sent] MessageID: ${info.messageId} to ${to}`);
      return info;
    } catch (err) {
      console.error(`[Email Failed] Failed to send email to ${to} via SMTP:`, err.message);
      // Fall back to logging on error
    }
  }

  // Console fallback
  console.log('\n==================================================');
  console.log(`[MOCK EMAIL SENT]`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`TEXT CONTENT: ${text || 'N/A'}`);
  console.log(`HTML CONTENT:`);
  console.log(html);
  console.log('==================================================\n');

  return { mock: true, to, subject };
}
