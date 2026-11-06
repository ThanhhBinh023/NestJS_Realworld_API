import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticlesAndTagsTables1793944720786 implements MigrationInterface {
  name = 'CreateArticlesAndTagsTables1793944720786';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`tags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(100) NOT NULL, UNIQUE INDEX \`IDX_d90243459a697eadb8ad56e909\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`articles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`slug\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(500) NOT NULL, \`body\` text NOT NULL, \`favoritesCount\` int NOT NULL DEFAULT '0', \`authorId\` int NULL, UNIQUE INDEX \`IDX_1123ff6815c5b8fec0ba9fec37\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`articles_tags\` (\`articleId\` int NOT NULL, \`tagId\` int NOT NULL, INDEX \`IDX_4687c4e88354261c3032ada7e4\` (\`articleId\`), INDEX \`IDX_b54b6a9b430c2fabecd25d3732\` (\`tagId\`), PRIMARY KEY (\`articleId\`, \`tagId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`articles\` ADD CONSTRAINT \`FK_65d9ccc1b02f4d904e90bd76a34\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`articles_tags\` ADD CONSTRAINT \`FK_4687c4e88354261c3032ada7e41\` FOREIGN KEY (\`articleId\`) REFERENCES \`articles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`articles_tags\` ADD CONSTRAINT \`FK_b54b6a9b430c2fabecd25d3732e\` FOREIGN KEY (\`tagId\`) REFERENCES \`tags\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`articles_tags\` DROP FOREIGN KEY \`FK_b54b6a9b430c2fabecd25d3732e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`articles_tags\` DROP FOREIGN KEY \`FK_4687c4e88354261c3032ada7e41\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`articles\` DROP FOREIGN KEY \`FK_65d9ccc1b02f4d904e90bd76a34\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b54b6a9b430c2fabecd25d3732\` ON \`articles_tags\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_4687c4e88354261c3032ada7e4\` ON \`articles_tags\``,
    );
    await queryRunner.query(`DROP TABLE \`articles_tags\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_1123ff6815c5b8fec0ba9fec37\` ON \`articles\``,
    );
    await queryRunner.query(`DROP TABLE \`articles\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d90243459a697eadb8ad56e909\` ON \`tags\``,
    );
    await queryRunner.query(`DROP TABLE \`tags\``);
  }
}
