import { Module } from '@nestjs/common';
import { MailProvider } from './mail.provider.js';
import { MailService } from './mail.service.js';

@Module({
  providers: [MailProvider, MailService],
  exports: [MailService],
})
export class MailModule {}
