import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCarDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2030)
  year: number;

  @IsString()
  color: string;

  @IsString()
  licensePlate: string;

  @IsString()
  @IsIn(['Petrol', 'Diesel', 'Electric', 'Hybrid'])
  fuelType: string;

  @IsString()
  @IsIn(['Automatic', 'Manual'])
  transmission: string;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(9)
  seats: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  pricePerDay: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  guaranteePrice: number;

  @IsString()
  @IsIn(['Sedan', 'SUV', 'Sports', 'Luxury', 'Electric', 'Compact'])
  category: string;
}