import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttachmentsTable1795780000000 implements MigrationInterface {
  name = 'CreateAttachmentsTable1795780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`attachments\` (\`id\` varchar(36) NOT NULL, \`attachable_type\` varchar(50) NOT NULL, \`attachable_id\` varchar(64) NOT NULL, \`url\` varchar(500) NOT NULL, \`file_name\` varchar(255) NOT NULL, \`file_type\` varchar(100) NOT NULL, \`file_size\` int UNSIGNED NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_attachments_attachable\` (\`attachable_type\`, \`attachable_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_attachments_attachable\` ON \`attachments\``,
    );
    await queryRunner.query(`DROP TABLE \`attachments\``);
  }
}
