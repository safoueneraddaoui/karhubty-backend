import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class CreateCarDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
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

  @IsNumber()
  @Min(2)
  @Max(9)
  seats: number;

  @IsNumber()
  @Min(0)
  pricePerDay: number;

  @IsNumber()
  @Min(0)
  guaranteePrice: number;

  @IsString()
  @IsIn(['Sedan', 'SUV', 'Sports', 'Luxury', 'Electric', 'Compact'])
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}