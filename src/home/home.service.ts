import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Home feed — top 50 cards by owner count ───────────────

  async getPopularCards() {
    // Get cards with their public inventory count
    const cards = await this.prisma.cards.findMany({
      include: {
        card_images: { take: 1, select: { image_url: true } },
        _count: {
          select: {
            inventario: {
              where: {
                user_id: { not: undefined },
                users: { is_public: true },
              },
            },
          },
        },
      },
      orderBy: {
        inventario: {
          _count: 'desc',
        },
      },
      take: 50,
    });

    return cards.map((card) => ({
      id: card.id,
      name: card.name,
      type: card.type,
      archetype: card.archetype,
      frame_type: card.frame_type,
      attribute: card.attribute,
      atk: card.atk,
      def: card.def,
      level: card.level,
      image_url: card.card_images[0]?.image_url ?? null,
      owner_count: card._count.inventario,
    }));
  }

  // ─── Card detail with owners ───────────────────────────────

  async getCardOwners(cardId: bigint) {
    const card = await this.prisma.cards.findUnique({
      where: { id: cardId },
      include: {
        card_images: { take: 1 },
        card_sets: { take: 5, orderBy: { set_price: 'desc' } },
      },
    });

    if (!card) {
      return null;
    }

    const owners = await this.prisma.inventario.findMany({
      where: {
        card_id: cardId,
        user_id: { not: undefined },
        users: { is_public: true },
      },
      include: {
        users: {
          select: {
            username: true,
            is_public: true,
            instagram: true,
            twitter: true,
            whatsapp: true,
            discord: true,
          },
        },
      },
      orderBy: { cantidad: 'desc' },
    });

    return {
      card: {
        id: card.id,
        name: card.name,
        type: card.type,
        archetype: card.archetype,
        frame_type: card.frame_type,
        attribute: card.attribute,
        atk: card.atk,
        def: card.def,
        level: card.level,
        description: card.description,
        image_url: card.card_images[0]?.image_url ?? null,
        sets: card.card_sets.map((s) => ({
          set_name: s.set_name,
          set_code: s.set_code,
          price: s.set_price,
        })),
      },
      owners: owners.map((o) => ({
        username: o.users?.username ?? 'Unknown',
        cantidad: o.cantidad,
        condicion: o.condicion,
        idioma: o.idioma,
        instagram: o.users?.instagram ?? null,
        twitter: o.users?.twitter ?? null,
        whatsapp: o.users?.whatsapp ?? null,
        discord: o.users?.discord ?? null,
      })),
    };
  }
}
