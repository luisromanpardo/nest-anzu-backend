import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // POST /social/follow/:userId
  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seguir a un usuario' })
  @ApiResponse({ status: 201, description: 'Follow creado' })
  @ApiResponse({ status: 400, description: 'No puedes seguirte a ti mismo' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya sigues a este usuario' })
  follow(
    @CurrentUser() user: { userId: number },
    @Param('userId') targetUserId: string,
  ) {
    return this.socialService.follow(user.userId, Number(targetUserId));
  }

  // DELETE /social/unfollow/:userId
  @Delete('unfollow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dejar de seguir a un usuario' })
  @ApiResponse({ status: 204, description: 'Unfollow realizado' })
  @ApiResponse({ status: 404, description: 'No sigues a este usuario' })
  unfollow(
    @CurrentUser() user: { userId: number },
    @Param('userId') targetUserId: string,
  ) {
    return this.socialService.unfollow(user.userId, Number(targetUserId));
  }

  // GET /social/followers/:userId?page=1&limit=20
  @Get('followers/:userId')
  @ApiOperation({ summary: 'Lista de seguidores de un usuario' })
  @ApiResponse({ status: 200, description: 'Lista paginada de followers' })
  getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowers(
      Number(userId),
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  // GET /social/following/:userId?page=1&limit=20
  @Get('following/:userId')
  @ApiOperation({ summary: 'Lista de usuarios que sigue un usuario' })
  @ApiResponse({ status: 200, description: 'Lista paginada de following' })
  getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowing(
      Number(userId),
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  // GET /social/followers/me (own followers)
  @Get('followers/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis seguidores' })
  getMyFollowers(
    @CurrentUser() user: { userId: number },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowers(
      user.userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  // GET /social/following/me (who I follow)
  @Get('following/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuarios que sigo' })
  getMyFollowing(
    @CurrentUser() user: { userId: number },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowing(
      user.userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
