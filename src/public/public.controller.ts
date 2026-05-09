import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // GET /u/:username
  @Get('u/:username')
  @ApiOperation({ summary: 'Inventario público de un usuario por username' })
  @ApiResponse({ status: 200, description: 'Perfil público + inventario' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado o es privado',
  })
  getProfileByUsername(@Param('username') username: string) {
    return this.publicService.getProfileByUsername(username);
  }
}
