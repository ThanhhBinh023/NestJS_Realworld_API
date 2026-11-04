import { Module } from '@nestjs/common';
import { HelloController } from './hello.controller.js';
import { HelloService } from './hello.service.js';

@Module({
  controllers: [HelloController],
  providers: [HelloService],
  exports: [HelloService],
})
export class HelloModule {}
