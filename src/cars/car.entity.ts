import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn()
  carId: number;

  @Column()
  agentId: number;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  color: string;

  @Column({ unique: true })
  licensePlate: string;

  @Column()
  fuelType: string; // Petrol, Diesel, Electric, Hybrid

  @Column()
  transmission: string; // Automatic, Manual

  @Column()
  seats: number;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerDay: number;

  @Column('decimal', { precision: 10, scale: 2 })
  guaranteePrice: number;

  @Column()
  category: string; // Sedan, SUV, Sports, Luxury, Electric, Compact

  @Column('simple-array', { nullable: true })
  images: string[]; // Array of image paths: ['cars/filename1.jpg', 'cars/filename2.jpg']

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  dateAdded: Date;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  // @ManyToOne(() => Agent, (agent) => agent.cars)
  // @JoinColumn({ name: 'agentId' })
  // agent: Agent;

  // @OneToMany(() => Rental, (rental) => rental.car)
  // rentals: Rental[];

  // @OneToMany(() => Review, (review) => review.car)
  // reviews: Review[];

  // @OneToMany(() => Availability, (availability) => availability.car)
  // availabilities: Availability[];
}