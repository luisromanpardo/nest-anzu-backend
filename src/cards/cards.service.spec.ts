import { Test, TestingModule } from '@nestjs/testing';
import { CardsService } from './cards.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CardsService', () => {
  let service: CardsService;

  const mockPrisma = {
    cards: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return empty results when no cards match', async () => {
      mockPrisma.cards.findMany.mockResolvedValue([]);
      mockPrisma.cards.count.mockResolvedValue(0);
      const result = await service.search('nonexistent', undefined, 1, 20);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should return cards matching name query', async () => {
      const mockCards = [
        {
          id: BigInt(1),
          name: 'Dark Magician',
          type: 'Monster',
          archetype: 'Dark Magic',
          frame_type: 'effect',
          attribute: 'dark',
          atk: 3000,
          def: 2000,
          level: 7,
          card_images: [{ image_url: 'http://example.com/darkmagician.jpg' }],
        },
      ];
      mockPrisma.cards.findMany.mockResolvedValue(mockCards);
      mockPrisma.cards.count.mockResolvedValue(1);
      const result = await service.search('dark', undefined, 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Dark Magician');
      expect(result.data[0].image_url).toBe(
        'http://example.com/darkmagician.jpg',
      );
    });

    it('should filter by archetype when provided', async () => {
      mockPrisma.cards.findMany.mockResolvedValue([]);
      mockPrisma.cards.count.mockResolvedValue(0);
      await service.search('dark', 'HERO', 1, 20);
      expect(mockPrisma.cards.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ archetype: 'HERO' }),
        }),
      );
    });

    it('should return paginated results', async () => {
      mockPrisma.cards.findMany.mockResolvedValue([]);
      mockPrisma.cards.count.mockResolvedValue(50);
      const result = await service.search(undefined, undefined, 2, 10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
    });
  });
});
