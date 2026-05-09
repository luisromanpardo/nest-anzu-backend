import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AddInventoryDto, UpdateInventoryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // GET /inventory/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mi inventario' })
  @ApiResponse({ status: 200, description: 'Lista de cartas en tu inventario' })
  getMyInventory(@CurrentUser() user: { userId: number }) {
    return this.inventoryService.getMyInventory(user.userId);
  }

  // POST /inventory
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar carta al inventario' })
  @ApiResponse({ status: 201, description: 'Carta agregada' })
  @ApiResponse({ status: 400, description: 'Límite de inventario alcanzado' })
  @ApiResponse({ status: 404, description: 'Carta no encontrada' })
  addCard(
    @CurrentUser() user: { userId: number },
    @Body() dto: AddInventoryDto,
  ) {
    return this.inventoryService.addCard(user.userId, dto);
  }

  // PATCH /inventory/:id
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar cantidad/condición de una carta' })
  @ApiResponse({ status: 200, description: 'Item actualizado' })
  @ApiResponse({
    status: 403,
    description: 'No puedes editar inventario ajeno',
  })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  updateItem(
    @CurrentUser() user: { userId: number },
    @Param('id') itemId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateItem(user.userId, Number(itemId), dto);
  }

  // DELETE /inventory/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar carta del inventario' })
  @ApiResponse({ status: 204, description: 'Item eliminado' })
  @ApiResponse({
    status: 403,
    description: 'No puedes eliminar inventario ajeno',
  })
  @ApiResponse({ status: 404, description: 'Item no encontrado' })
  deleteItem(
    @CurrentUser() user: { userId: number },
    @Param('id') itemId: string,
  ) {
    return this.inventoryService.deleteItem(user.userId, Number(itemId));
  }
}
