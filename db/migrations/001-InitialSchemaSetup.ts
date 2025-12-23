import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchemaSetup1700000000000 implements MigrationInterface {
  name = 'InitialSchemaSetup1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS auth`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS workout`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS auth CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS workout CASCADE`);
  }
}
