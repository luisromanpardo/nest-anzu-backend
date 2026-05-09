import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockPrisma = {
    inventario: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cards: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe('getMyInventory', () => {
    it('should return empty array when inventory is empty', async () => {
      mockPrisma.inventario.findMany.mockResolvedValue([]);
      const result = await service.getMyInventory(1);
      expect(result).toHaveLength(0);
    });

    it('should return inventory items with card details', async () => {
      const mockItem = {
        inventario_id: 1,
        card_id: BigInt(100),
        cantidad: 1,
        condicion: 'Near Mint',
        idioma: 'Inglés',
        edicion: '1st Edition',
        notas: null,
        cards: {
          id: BigInt(100),
          name: 'Dark Magician',
          type: 'Monster',
          archetype: 'Dark Magic',
          frame_type: 'effect',
          attribute: 'dark',
          atk: 3000,
          def: 2000,
          level: 7,
          card_images: [{ image_url: 'http://example.com/img.jpg' }],
        },
      };
      mockPrisma.inventario.findMany.mockResolvedValue([mockItem]);
      const result = await service.getMyInventory(1);
      expect(result).toHaveLength(1);
      expect(result[0].card.name).toBe('Dark Magician');
      expect(result[0].card.image_url).toBe('http://example.com/img.jpg');
    });
  });

  describe('addCard', () => {
    it('should throw NotFoundException when card does not exist', async () => {
      mockPrisma.cards.findUnique.mockResolvedValue(null);
      await expect(service.addCard(1, { card_id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when inventory limit reached', async () => {
      mockPrisma.cards.findUnique.mockResolvedValue({ id: BigInt(100) });
      mockPrisma.inventario.count.mockResolvedValue(100);
      mockPrisma.inventario.findFirst.mockResolvedValue(null);
      await expect(service.addCard(1, { card_id: 100 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update quantity when card already in inventory', async () => {
      mockPrisma.cards.findUnique.mockResolvedValue({ id: BigInt(100) });
      mockPrisma.inventario.count.mockResolvedValue(50);
      mockPrisma.inventario.findFirst.mockResolvedValue({
        inventario_id: 1,
        cantidad: 1,
      });
      mockPrisma.inventario.update.mockResolvedValue({
        inventario_id: 1,
        cantidad: 3,
        cards: {
          id: BigInt(100),
          name: 'Dark Magician',
          type: 'Monster',
          archetype: 'Dark Magic',
        },
      });
      const result = await service.addCard(1, { card_id: 100, cantidad: 2 });
      expect((result as any).message).toBe('Cantidad actualizada');
    });

    it('should create new inventory item successfully', async () => {
      mockPrisma.cards.findUnique.mockResolvedValue({ id: BigInt(100) });
      mockPrisma.inventario.count.mockResolvedValue(50);
      mockPrisma.inventario.findFirst.mockResolvedValue(null);
      mockPrisma.inventario.create.mockResolvedValue({
        inventario_id: 2,
        card_id: BigInt(100),
        cantidad: 1,
        vendedor_id: 1,
        cards: {
          id: BigInt(100),
          name: 'Dark Magician',
          type: 'Monster',
          archetype: 'Dark Magic',
        },
      });
      const result = await service.addCard(1, { card_id: 100 });
      expect(mockPrisma.inventario.create).toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      mockPrisma.inventario.findUnique.mockResolvedValue(null);
      await expect(service.updateItem(1, 999, { cantidad: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when updating other user item', async () => {
      mockPrisma.inventario.findUnique.mockResolvedValue({
        inventario_id: 1,
        user_id: 2,
      });
      await expect(service.updateItem(1, 1, { cantidad: 5 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update item successfully', async () => {
      mockPrisma.inventario.findUnique.mockResolvedValue({
        inventario_id: 1,
        user_id: 1,
      });
      mockPrisma.inventario.update.mockResolvedValue({
        inventario_id: 1,
        cantidad: 5,
        cards: {
          id: BigInt(100),
          name: 'Dark Magician',
          type: 'Monster',
          archetype: 'Dark Magic',
        },
      });
      const result = await service.updateItem(1, 1, { cantidad: 5 });
      expect(result.cantidad).toBe(5);
    });
  });

  describe('deleteItem', () => {
    it('should throw NotFoundException when item does not exist', async () => {
      mockPrisma.inventario.findUnique.mockResolvedValue(null);
      await expect(service.deleteItem(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when deleting other user item', async () => {
      mockPrisma.inventario.findUnique.mockResolvedValue({
        inventario_id: 1,
        user_id: 2,
      });
      await expect(service.deleteItem(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should delete item successfully', async () => {
      mockPrisma.inventario.findUnique.mockResolvedValue({
        inventario_id: 1,
        user_id: 1,
      });
      mockPrisma.inventario.delete.mockResolvedValue({});
      const result = await service.deleteItem(1, 1);
      expect(result.message).toBe('Item eliminado');
    });
  });
});
