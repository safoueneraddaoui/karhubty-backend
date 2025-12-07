import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // Don't send password in responses
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column()
  city: string;

  @CreateDateColumn()
  dateCreated: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'user' })
  role: string; // 'user', 'agent', 'superadmin'

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations will be added later
  // @OneToMany(() => Rental, (rental) => rental.user)
  // rentals: Rental[];

  // @OneToMany(() => Review, (review) => review.user)
  // reviews: Review[];
}