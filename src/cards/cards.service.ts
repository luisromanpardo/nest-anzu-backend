import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query?: string, archetype?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.name = { contains: query, mode: 'insensitive' };
    }

    if (archetype) {
      where.archetype = archetype;
    }

    const [cards, total] = await Promise.all([
      this.prisma.cards.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          archetype: true,
          frame_type: true,
          attribute: true,
          atk: true,
          def: true,
          level: true,
          card_images: {
            take: 1,
            select: { image_url: true },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.cards.count({ where }),
    ]);

    // Transform to include image_url at card level
    const data = cards.map((card) => ({
      ...card,
      image_url: card.card_images[0]?.image_url ?? null,
      card_images: undefined,
    }));

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
