import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Perfil público de un usuario ──────────────────────────
  // GET /users/:username (público, sin auth)

  async getPublicProfile(username: string) {
    const user = await this.prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        role: true,
        is_public: true,
        // Redes sociales
        instagram: true,
        twitter: true,
        facebook: true,
        whatsapp: true,
        discord: true,
        konami_id: true,
        // Stats básicas
        created_at: true,
        _count: {
          select: { inventario: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario "${username}" no encontrado`);
    }

    // Solo devolver si es público o si es el propio usuario
    return {
      username: user.username,
      role: user.role,
      is_public: user.is_public,
      instagram: user.instagram,
      twitter: user.twitter,
      facebook: user.facebook,
      whatsapp: user.whatsapp,
      discord: user.discord,
      konami_id: user.konami_id,
      created_at: user.created_at,
      card_count: user._count.inventario,
    };
  }

  // ─── Perfil propio (autenticado) ───────────────────────────
  // GET /users/me (requiere auth)

  async getOwnProfile(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_public: true,
        instagram: true,
        twitter: true,
        facebook: true,
        whatsapp: true,
        discord: true,
        konami_id: true,
        created_at: true,
        _count: {
          select: { inventario: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      ...user,
      card_count: user._count.inventario,
    };
  }

  // ─── Actualizar perfil propio ──────────────────────────────
  // PATCH /users/me

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // Si cambia username, verificar que no exista
    if (dto.username) {
      const existing = await this.prisma.users.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('El username ya está en uso');
      }
    }

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_public: true,
        instagram: true,
        twitter: true,
        facebook: true,
        whatsapp: true,
        discord: true,
        konami_id: true,
        created_at: true,
      },
    });

    return updated;
  }

  // ─── Usuarios privados ─────────────────────────────────────

  async makePrivate(userId: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { is_public: false },
    });
  }

  async makePublic(userId: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { is_public: true },
    });
  }
}