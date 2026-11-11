import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Article } from './article.entity.js';

@Entity('favorites')
@Unique(['userId', 'articleId'])
export class Favorite extends BaseEntity {
  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'int' })
  articleId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article!: Article;
}
