import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetSuperadminRole1735148000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Set the first user (or user with specific email) as superadmin
    // Adjust the condition based on your superadmin identification logic
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'superadmin' WHERE "userId" = 1`,
    );
    console.log('✅ Superadmin role set for user ID 1');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the superadmin role back to 'user'
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'user' WHERE "userId" = 1`,
    );
    console.log('↩️ Reverted superadmin role for user ID 1');
  }
}
