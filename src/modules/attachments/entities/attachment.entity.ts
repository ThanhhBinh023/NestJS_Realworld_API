import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AttachableType {
  USER = 'user',
  ARTICLE = 'article',
}

@Entity('attachments')
@Index(['attachableType', 'attachableId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'attachable_type', type: 'varchar', length: 50 })
  attachableType!: string;

  @Column({ name: 'attachable_id', type: 'varchar', length: 64 })
  attachableId!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'file_type', type: 'varchar', length: 100 })
  fileType!: string;

  @Column({ name: 'file_size', type: 'int', unsigned: true })
  fileSize!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
