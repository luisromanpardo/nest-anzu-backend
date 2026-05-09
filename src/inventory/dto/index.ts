import { IsInt, IsOptional, IsString, IsIn, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddInventoryDto {
  @ApiProperty({ description: 'Card ID from the catalog' })
  @IsInt()
  card_id: number;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Max(999)
  cantidad?: number;

  @ApiPropertyOptional({ default: 'Near Mint' })
  @IsString()
  @IsIn([
    'Near Mint',
    'Mint',
    'Light Play',
    'Moderately Played',
    'Heavily Played',
    'Damaged',
  ])
  condicion?: string;

  @ApiPropertyOptional({ default: 'Inglés' })
  @IsString()
  idioma?: string;

  @ApiPropertyOptional()
  @IsString()
  edicion?: string;

  @ApiPropertyOptional()
  @IsString()
  notas?: string;
}

export class UpdateInventoryDto {
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  cantidad?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsIn([
    'Near Mint',
    'Mint',
    'Light Play',
    'Moderately Played',
    'Heavily Played',
    'Damaged',
  ])
  condicion?: string;

  @ApiPropertyOptional()
  @IsString()
  idioma?: string;

  @ApiPropertyOptional()
  @IsString()
  edicion?: string;

  @ApiPropertyOptional()
  @IsString()
  notas?: string;
}
