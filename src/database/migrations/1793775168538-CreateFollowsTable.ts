import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFollowsTable1793775168538 implements MigrationInterface {
  name = 'CreateFollowsTable1793775168538';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`follows\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`followerId\` int NOT NULL, \`followingId\` int NOT NULL, UNIQUE INDEX \`IDX_105079775692df1f8799ed0fac\` (\`followerId\`, \`followingId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`follows\` ADD CONSTRAINT \`FK_fdb91868b03a2040db408a53331\` FOREIGN KEY (\`followerId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`follows\` ADD CONSTRAINT \`FK_ef463dd9a2ce0d673350e36e0fb\` FOREIGN KEY (\`followingId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`follows\` DROP FOREIGN KEY \`FK_ef463dd9a2ce0d673350e36e0fb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`follows\` DROP FOREIGN KEY \`FK_fdb91868b03a2040db408a53331\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_105079775692df1f8799ed0fac\` ON \`follows\``,
    );
    await queryRunner.query(`DROP TABLE \`follows\``);
  }
}
