import * as nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.warn('[Mail] SMTP no configurado — envío de correo deshabilitado');
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export function getMailFrom(): string {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@arcas.com';
}
