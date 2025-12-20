import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  notificationId: number;

  @Column()
  recipientId: number; // User or Agent ID

  @Column()
  recipientType: string; // 'user', 'agent', 'superadmin'

  @Column()
  type: string; // 'rental_request', 'rental_approved', 'rental_rejected', 'car_available'

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  relatedEntityType: string; // 'rental', 'car', 'agent'

  @Column({ nullable: true })
  relatedEntityId: number;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
