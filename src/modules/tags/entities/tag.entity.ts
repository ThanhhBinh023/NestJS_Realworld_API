import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';

@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;
}
