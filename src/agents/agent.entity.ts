import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn()
  agentId: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  agencyName: string;

  @Column()
  agencyAddress: string;

  @Column()
  city: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  approvalOfAgency: string; // Document path

  @CreateDateColumn()
  dateRegistered: Date;

  @Column({ default: 'pending' }) // pending, approved, suspended, rejected
  accountStatus: string;

  @Column({ nullable: true })
  approvalDate: Date;

  @Column({ default: 'agent' })
  role: string;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  // @OneToMany(() => Car, (car) => car.agent)
  // cars: Car[];

  // @OneToMany(() => Rental, (rental) => rental.agent)
  // rentals: Rental[];
}