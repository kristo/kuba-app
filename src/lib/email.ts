import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail(opts: EmailOptions) {
  const { to, subject, text, html } = opts;

  // If SMTP env is configured, try to send; otherwise just log the message.
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log("[email stub] to:", to);
    console.log("subject:", subject);
    console.log(text ?? html);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `no-reply@${process.env.SMTP_HOST}`,
    to,
    subject,
    text,
    html,
  });
}
