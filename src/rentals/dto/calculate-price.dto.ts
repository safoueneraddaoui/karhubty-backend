import { IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CalculatePriceDto {
  @IsNumber()
  @IsNotEmpty()
  carId: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}