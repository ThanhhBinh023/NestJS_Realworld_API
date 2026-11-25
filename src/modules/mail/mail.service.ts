import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { MAIL_TRANSPORTER } from './mail.provider.js';

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendMailResult {
  delivered: boolean;
  mode: 'smtp' | 'fallback';
  messageId?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Handles transactional email delivery via SMTP with a safe console-log fallback.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(MAIL_TRANSPORTER)
    private readonly transporter: Transporter | null,
  ) {}

  /** Returns true when SMTP transport is configured and ready to send. */
  isConfigured(): boolean {
    const host = this.configService.get<string>('MAIL_HOST');
    return Boolean(host && this.transporter);
  }

  /** Sends an email via SMTP, or logs a preview when SMTP is unconfigured. */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    if (!this.isConfigured() || !this.transporter) {
      this.logger.log(
        `[Fallback Mail] To: ${options.to} | Subject: ${options.subject}`,
      );
      return {
        delivered: false,
        mode: 'fallback',
      };
    }

    const from = this.configService.get<string>(
      'MAIL_FROM',
      'noreply@realworld.local',
    );

    try {
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(
        `Email sent to ${options.to} (messageId: ${info.messageId})`,
      );
      return {
        delivered: true,
        mode: 'smtp',
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  /** Sends a welcome email to a newly registered user. */
  async sendWelcomeEmail(
    to: string,
    username: string,
  ): Promise<SendMailResult> {
    const safeUsername = escapeHtml(username);
    const subject = 'Welcome to RealWorld Conduit!';
    const text = `Hi ${username},\n\nWelcome to RealWorld Conduit! Your account is ready to publish and explore articles.\n\nBest regards,\nRealWorld Team`;
    const html = [
      `<p>Hi <strong>${safeUsername}</strong>,</p>`,
      '<p>Welcome to <strong>RealWorld Conduit</strong>! Your account is ready to publish and explore articles.</p>',
      '<p>Best regards,<br/>RealWorld Team</p>',
    ].join('');

    return this.sendMail({
      to,
      subject,
      text,
      html,
    });
  }
}
