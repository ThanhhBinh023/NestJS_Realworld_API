import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Follow } from './entities/follow.entity.js';
import { ProfilesController } from './profiles.controller.js';
import { ProfilesService } from './profiles.service.js';
import { UsersModule } from '../users/users.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User]), UsersModule, AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService, TypeOrmModule],
})
export class ProfilesModule {}
