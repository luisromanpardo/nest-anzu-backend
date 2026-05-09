import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddInventoryDto, UpdateInventoryDto } from './dto';

const MAX_INVENTORY_ITEMS = 100;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── List own inventory ─────────────────────────────────────

  async getMyInventory(userId: number) {
    const items = await this.prisma.inventario.findMany({
      where: { user_id: userId },
      include: {
        cards: {
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
            card_images: { take: 1, select: { image_url: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return items.map((item) => ({
      id: item.inventario_id,
      card_id: item.card_id,
      cantidad: item.cantidad,
      condicion: item.condicion,
      idioma: item.idioma,
      edicion: item.edicion,
      notas: item.notas,
      card: {
        ...item.cards,
        image_url: item.cards.card_images[0]?.image_url ?? null,
      },
    }));
  }

  // ─── Add card to inventory ───────────────────────────────────

  async addCard(userId: number, dto: AddInventoryDto) {
    const {
      card_id,
      cantidad = 1,
      condicion = 'Near Mint',
      idioma = 'Inglés',
      edicion,
      notas,
    } = dto;

    // Card must exist
    const card = await this.prisma.cards.findUnique({ where: { id: card_id } });
    if (!card) {
      throw new NotFoundException('Carta no encontrada en el catálogo');
    }

    // Check limit — count distinct cards
    const currentCount = await this.prisma.inventario.count({
      where: { user_id: userId },
    });

    // If user doesn't already have this card, check against limit
    const existingItem = await this.prisma.inventario.findFirst({
      where: { user_id: userId, card_id },
    });

    if (!existingItem && currentCount >= MAX_INVENTORY_ITEMS) {
      throw new BadRequestException(
        `Inventory limit reached (${MAX_INVENTORY_ITEMS} cards). Remove a card before adding a new one.`,
      );
    }

    if (existingItem) {
      // Update quantity instead of creating new
      const updated = await this.prisma.inventario.update({
        where: { inventario_id: existingItem.inventario_id },
        data: { cantidad: existingItem.cantidad + cantidad },
        include: {
          cards: {
            select: {
              id: true,
              name: true,
              type: true,
              archetype: true,
            },
          },
        },
      });
      return { ...updated, message: 'Cantidad actualizada' };
    }

    // Create new inventory item
    // vendedor_id: DB default = 1 (system vendor), explicit para type safety
    const item = await this.prisma.inventario.create({
      data: {
        user_id: userId,
        card_id,
        cantidad,
        condicion,
        idioma,
        edicion,
        notas,
        vendedor_id: 1,
      },
      include: {
        cards: {
          select: {
            id: true,
            name: true,
            type: true,
            archetype: true,
          },
        },
      },
    });

    return item;
  }

  // ─── Update inventory item ───────────────────────────────────

  async updateItem(userId: number, itemId: number, dto: UpdateInventoryDto) {
    const item = await this.prisma.inventario.findUnique({
      where: { inventario_id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    if (item.user_id !== userId) {
      throw new ForbiddenException(
        'No puedes editar el inventario de otro usuario',
      );
    }

    const updated = await this.prisma.inventario.update({
      where: { inventario_id: itemId },
      data: dto,
      include: {
        cards: {
          select: {
            id: true,
            name: true,
            type: true,
            archetype: true,
          },
        },
      },
    });

    return updated;
  }

  // ─── Delete inventory item ───────────────────────────────────

  async deleteItem(userId: number, itemId: number) {
    const item = await this.prisma.inventario.findUnique({
      where: { inventario_id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    if (item.user_id !== userId) {
      throw new ForbiddenException(
        'No puedes eliminar el inventario de otro usuario',
      );
    }

    await this.prisma.inventario.delete({
      where: { inventario_id: itemId },
    });

    return { message: 'Item eliminado' };
  }
}
