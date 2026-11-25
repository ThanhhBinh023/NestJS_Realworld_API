import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { MailService } from './mail.service.js';

describe('MailService', () => {
  let mockConfigService: ConfigService;
  let mockTransporter: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockTransporter = {
      sendMail: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: string) => {
        if (key === 'MAIL_FROM') {
          return defaultValue ?? 'noreply@realworld.local';
        }
        return undefined;
      }),
    } as unknown as ConfigService;
  });

  describe('isConfigured', () => {
    it('should return false when MAIL_HOST or transporter is missing', () => {
      const serviceWithoutHost = new MailService(
        mockConfigService,
        mockTransporter as unknown as Transporter,
      );
      expect(serviceWithoutHost.isConfigured()).toBe(false);

      const serviceWithoutTransporter = new MailService(
        {
          get: vi.fn().mockReturnValue('smtp.example.com'),
        } as unknown as ConfigService,
        null,
      );
      expect(serviceWithoutTransporter.isConfigured()).toBe(false);
    });

    it('should return true when MAIL_HOST and transporter are configured', () => {
      const configuredService = new MailService(
        {
          get: vi.fn().mockReturnValue('smtp.example.com'),
        } as unknown as ConfigService,
        mockTransporter as unknown as Transporter,
      );
      expect(configuredService.isConfigured()).toBe(true);
    });
  });

  describe('sendMail', () => {
    it('should fallback cleanly without sending SMTP email when unconfigured', async () => {
      const mailService = new MailService(mockConfigService, null);

      const result = await mailService.sendMail({
        to: 'binh@test.com',
        subject: 'Hello Binh',
        text: 'Plain text body',
      });

      expect(result).toEqual({
        delivered: false,
        mode: 'fallback',
      });
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should send email via SMTP transporter when configured', async () => {
      const configWithSmtp = {
        get: vi.fn((key: string, defaultValue?: string) => {
          if (key === 'MAIL_HOST') return 'smtp.example.com';
          if (key === 'MAIL_FROM') return 'conduit@realworld.dev';
          return defaultValue;
        }),
      } as unknown as ConfigService;

      mockTransporter.sendMail.mockResolvedValueOnce({
        messageId: '<msg-123@realworld.dev>',
      });

      const mailService = new MailService(
        configWithSmtp,
        mockTransporter as unknown as Transporter,
      );

      const result = await mailService.sendMail({
        to: 'binh@test.com',
        subject: 'Test Subject',
        text: 'Hello Binh',
        html: '<p>Hello Binh</p>',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'conduit@realworld.dev',
        to: 'binh@test.com',
        subject: 'Test Subject',
        text: 'Hello Binh',
        html: '<p>Hello Binh</p>',
      });
      expect(result).toEqual({
        delivered: true,
        mode: 'smtp',
        messageId: '<msg-123@realworld.dev>',
      });
    });

    it('should propagate SMTP delivery errors so queue processors can retry', async () => {
      const configWithSmtp = {
        get: vi.fn((key: string, defaultValue?: string) => {
          if (key === 'MAIL_HOST') return 'smtp.example.com';
          return defaultValue;
        }),
      } as unknown as ConfigService;

      mockTransporter.sendMail.mockRejectedValueOnce(
        new Error('SMTP connection timeout'),
      );

      const mailService = new MailService(
        configWithSmtp,
        mockTransporter as unknown as Transporter,
      );

      await expect(
        mailService.sendMail({
          to: 'binh@test.com',
          subject: 'Retry test',
          text: 'Body',
        }),
      ).rejects.toThrow('SMTP connection timeout');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should format welcome email and escape HTML characters in username', async () => {
      const configWithSmtp = {
        get: vi.fn((key: string, defaultValue?: string) => {
          if (key === 'MAIL_HOST') return 'smtp.example.com';
          if (key === 'MAIL_FROM') return 'noreply@realworld.local';
          return defaultValue;
        }),
      } as unknown as ConfigService;

      mockTransporter.sendMail.mockResolvedValueOnce({
        messageId: '<welcome-1@realworld.local>',
      });

      const mailService = new MailService(
        configWithSmtp,
        mockTransporter as unknown as Transporter,
      );

      const result = await mailService.sendWelcomeEmail(
        'binh@test.com',
        'binh<script>',
      );

      expect(result.delivered).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'binh@test.com',
          subject: 'Welcome to RealWorld Conduit!',
          html: expect.stringContaining('binh&lt;script&gt;'),
        }),
      );
    });
  });
});
