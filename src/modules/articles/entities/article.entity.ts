import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Tag } from '../../tags/entities/tag.entity.js';

@Entity('articles')
export class Article extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'int', default: 0 })
  favoritesCount!: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  author!: User;

  @ManyToMany(() => Tag, { eager: true, cascade: true })
  @JoinTable({
    name: 'articles_tags',
    joinColumn: { name: 'articleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags!: Tag[];
}
