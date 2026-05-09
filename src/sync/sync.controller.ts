import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { Role } from '../auth/enums/role.enum';

@ApiTags('admin')
@Controller('admin')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // POST /admin/sync
  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sincronizar catálogo desde YGOProDeck (solo admin)',
  })
  @ApiResponse({ status: 200, description: 'Sync completado con stats' })
  @ApiResponse({ status: 403, description: 'Solo administradores' })
  async sync() {
    return this.syncService.triggerSync();
  }

  // GET /admin/sync/status
  @Get('sync/status')
  @ApiOperation({ summary: 'Estado de la última sincronización' })
  @ApiResponse({ status: 200, description: 'Último sync_log' })
  async getStatus() {
    return this.syncService.getLastSyncStatus();
  }
}
