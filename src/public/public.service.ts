import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /u/:username
  async getProfileByUsername(username: string) {
    const user = await this.prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
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

    if (!user || !user.is_public) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const inventory = await this.prisma.inventario.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        cards: {
          select: {
            id: true,
            name: true,
            type: true,
            archetype: true,
            frame_type: true,
            attribute: true,
            card_images: { take: 1, select: { image_url: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      username: user.username,
      role: user.role,
      created_at: user.created_at,
      social: {
        instagram: user.instagram,
        twitter: user.twitter,
        facebook: user.facebook,
        whatsapp: user.whatsapp,
        discord: user.discord,
        konami_id: user.konami_id,
      },
      card_count: user._count.inventario,
      inventory: inventory.map((item) => ({
        id: item.inventario_id,
        card_id: item.card_id,
        cantidad: item.cantidad,
        condicion: item.condicion,
        idioma: item.idioma,
        edicion: item.edicion,
        card: {
          ...item.cards,
          image_url: item.cards.card_images[0]?.image_url ?? null,
        },
      })),
    };
  }
}
