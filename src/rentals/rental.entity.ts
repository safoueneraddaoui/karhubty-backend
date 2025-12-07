import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn()
  rentalId: number;

  @Column()
  userId: number;

  @Column()
  carId: number;

  @Column()
  agentId: number;

  @Column('date')
  startDate: Date;

  @Column('date')
  endDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  guaranteeAmount: number;

  @Column({ default: 'pending' }) // pending, approved, rejected, completed, cancelled
  status: string;

  @CreateDateColumn()
  requestDate: Date;

  @Column({ nullable: true })
  approvalDate: Date;

  @Column({ nullable: true })
  completionDate: Date;

  @Column({ default: 'pending' }) // pending, paid, refunded
  paymentStatus: string;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  // @ManyToOne(() => User, (user) => user.rentals)
  // @JoinColumn({ name: 'userId' })
  // user: User;

  // @ManyToOne(() => Car, (car) => car.rentals)
  // @JoinColumn({ name: 'carId' })
  // car: Car;

  // @ManyToOne(() => Agent, (agent) => agent.rentals)
  // @JoinColumn({ name: 'agentId' })
  // agent: Agent;

  // @OneToOne(() => Review, (review) => review.rental)
  // review: Review;
}