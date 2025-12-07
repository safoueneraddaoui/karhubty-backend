import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('agent_requests')
export class AgentRequest {
  @PrimaryGeneratedColumn()
  requestId: number;

  @Column()
  email: string;

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
  approvalDocument: string; // Document path

  @CreateDateColumn()
  requestDate: Date;

  @Column({ default: 'pending' }) // pending, approved, rejected
  status: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @UpdateDateColumn()
  updatedAt: Date;
}