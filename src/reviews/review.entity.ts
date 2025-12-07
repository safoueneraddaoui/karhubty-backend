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

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  reviewId: number;

  @Column()
  userId: number;

  @Column()
  carId: number;

  @Column()
  rentalId: number;

  @Column({ type: 'int', width: 1 }) // 1-5 stars
  rating: number;

  @Column('text')
  comment: string;

  @CreateDateColumn()
  reviewDate: Date;

  @Column({ default: true })
  isApproved: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  // @ManyToOne(() => User, (user) => user.reviews)
  // @JoinColumn({ name: 'userId' })
  // user: User;

  // @ManyToOne(() => Car, (car) => car.reviews)
  // @JoinColumn({ name: 'carId' })
  // car: Car;

  // @OneToOne(() => Rental, (rental) => rental.review)
  // @JoinColumn({ name: 'rentalId' })
  // rental: Rental;
}