import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow extends BaseEntity {
  @Column({ type: 'int' })
  followerId!: number;

  @Column({ type: 'int' })
  followingId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followingId' })
  following!: User;
}
