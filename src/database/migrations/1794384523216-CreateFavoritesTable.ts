import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFavoritesTable1794384523216 implements MigrationInterface {
  name = 'CreateFavoritesTable1794384523216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`favorites\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL, \`articleId\` int NOT NULL, UNIQUE INDEX \`IDX_a399865198a065686cbb981db4\` (\`userId\`, \`articleId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`favorites\` ADD CONSTRAINT \`FK_e747534006c6e3c2f09939da60f\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`favorites\` ADD CONSTRAINT \`FK_a9e25be94f65c6f11f420d97bca\` FOREIGN KEY (\`articleId\`) REFERENCES \`articles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`favorites\` DROP FOREIGN KEY \`FK_a9e25be94f65c6f11f420d97bca\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`favorites\` DROP FOREIGN KEY \`FK_e747534006c6e3c2f09939da60f\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a399865198a065686cbb981db4\` ON \`favorites\``,
    );
    await queryRunner.query(`DROP TABLE \`favorites\``);
  }
}
