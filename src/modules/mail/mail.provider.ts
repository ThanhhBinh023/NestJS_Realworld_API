import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export const MAIL_TRANSPORTER = 'MAIL_TRANSPORTER';

/**
 * Factory provider creating a Nodemailer SMTP transporter when MAIL_HOST is configured.
 * Returns null in local/test environments without SMTP settings so MailService can fallback safely.
 */
export const MailProvider = {
  provide: MAIL_TRANSPORTER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Transporter | null => {
    const host = configService.get<string>('MAIL_HOST');
    if (!host) {
      return null;
    }

    const port = parseInt(configService.get<string>('MAIL_PORT', '587'), 10);
    const secure = configService.get<string>('MAIL_SECURE', 'false') === 'true';
    const user = configService.get<string>('MAIL_USER');
    const pass = configService.get<string>('MAIL_PASS');

    return nodemailer.createTransport({
      host,
      port: Number.isNaN(port) ? 587 : port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  },
};
