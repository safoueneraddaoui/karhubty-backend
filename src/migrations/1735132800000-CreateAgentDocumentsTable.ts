import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAgentDocumentsTable1735132800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agent_documents',
        columns: [
          {
            name: 'documentId',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'agentId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'documentType',
            type: 'varchar',
            isNullable: false,
            comment: 'License, Insurance, Registration, Inspection, etc.',
          },
          {
            name: 'filePath',
            type: 'varchar',
            isNullable: false,
            comment: 'Path to uploaded file',
          },
          {
            name: 'fileName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'fileSize',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
            isNullable: false,
            comment: 'pending, verified, rejected',
          },
          {
            name: 'rejectionReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'uploadedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verifiedBy',
            type: 'int',
            isNullable: true,
            comment: 'Admin user ID who verified',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['agentId'],
            referencedTableName: 'agents',
            referencedColumnNames: ['agentId'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('agent_documents');
  }
}
