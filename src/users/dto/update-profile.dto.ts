import { IsOptional, IsString, IsBoolean, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Nombre de usuario', minLength: 3, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ description: 'Instagram handle', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram?: string;

  @ApiPropertyOptional({ description: 'Twitter/X handle', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  twitter?: string;

  @ApiPropertyOptional({ description: 'Facebook profile URL', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  facebook?: string;

  @ApiPropertyOptional({ description: 'WhatsApp número', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional({ description: 'Discord handle', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  discord?: string;

  @ApiPropertyOptional({ description: 'Konami ID', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  konami_id?: string;

  @ApiPropertyOptional({ description: 'Inventario público o privado' })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}