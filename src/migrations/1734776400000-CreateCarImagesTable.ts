import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCarImagesTable1734776400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create car_images table
    await queryRunner.createTable(
      new Table({
        name: 'car_images',
        columns: [
          {
            name: 'imageId',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'carId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'filename',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'originalName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'size',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'width',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'height',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isPrimary',
            type: 'boolean',
            default: false,
          },
          {
            name: 'displayOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'imagePath',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'uploadedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            columnNames: ['carId'],
          },
          {
            columnNames: ['isPrimary'],
          },
          {
            columnNames: ['displayOrder'],
          },
        ],
      }),
      true,
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'car_images',
      new TableForeignKey({
        columnNames: ['carId'],
        referencedTableName: 'cars',
        referencedColumnNames: ['carId'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table
    await queryRunner.dropTable('car_images');
  }
}
