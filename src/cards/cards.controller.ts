import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CardsService } from './cards.service';

@ApiTags('cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  // GET /cards/search?q=dark&archetype=HERO&page=1&limit=20
  @Get('search')
  @ApiOperation({ summary: 'Buscar cartas por nombre y/o arquetipo' })
  @ApiResponse({ status: 200, description: 'Resultados paginados de cartas' })
  search(
    @Query('q') query?: string,
    @Query('archetype') archetype?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cardsService.search(
      query,
      archetype,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
