import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HomeService } from './home.service';

@ApiTags('home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  // GET /home
  @Get()
  @ApiOperation({ summary: 'Feed de cartas más populares (top 50 por owners)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cartas ordenadas por cantidad de owners',
  })
  getPopularCards() {
    return this.homeService.getPopularCards();
  }

  // GET /cards/:id/owners
  @Get('cards/:id/owners')
  @ApiOperation({ summary: 'Detalle de carta + lista de propietarios' })
  @ApiResponse({ status: 200, description: 'Card details + owners list' })
  @ApiResponse({ status: 404, description: 'Carta no encontrada' })
  getCardOwners(@Param('id') cardId: string) {
    return this.homeService.getCardOwners(BigInt(cardId));
  }
}
