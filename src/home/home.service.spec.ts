import { Test, TestingModule } from '@nestjs/testing';
import { HomeService } from './home.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HomeService', () => {
  let service: HomeService;

  const mockPrisma = {
    cards: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    inventario: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    jest.clearAllMocks();
  });

  describe('getPopularCards', () => {
    it('should return top 50 cards sorted by owner count', async () => {
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
          card_images: [{ image_url: 'http://example.com/dark.jpg' }],
          _count: { inventario: 42 },
        },
        {
          id: BigInt(2),
          name: 'Blue-Eyes White Dragon',
          type: 'Monster',
          archetype: 'Blue-Eyes',
          frame_type: 'normal',
          attribute: 'light',
          atk: 3000,
          def: 2500,
          level: 8,
          card_images: [{ image_url: 'http://example.com/blue.jpg' }],
          _count: { inventario: 15 },
        },
      ];
      mockPrisma.cards.findMany.mockResolvedValue(mockCards);
      const result = await service.getPopularCards();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Dark Magician');
      expect(result[0].owner_count).toBe(42);
      expect(result[0].image_url).toBe('http://example.com/dark.jpg');
    });

    it('should return empty array when no cards have owners', async () => {
      mockPrisma.cards.findMany.mockResolvedValue([]);
      const result = await service.getPopularCards();
      expect(result).toHaveLength(0);
    });
  });

  describe('getCardOwners', () => {
    it('should return null when card does not exist', async () => {
      mockPrisma.cards.findUnique.mockResolvedValue(null);
      const result = await service.getCardOwners(BigInt(999));
      expect(result).toBeNull();
    });

    it('should return card with owners list', async () => {
      const mockCard = {
        id: BigInt(1),
        name: 'Dark Magician',
        type: 'Monster',
        archetype: 'Dark Magic',
        frame_type: 'effect',
        attribute: 'dark',
        atk: 3000,
        def: 2000,
        level: 7,
        description: 'Classic card',
        card_images: [{ image_url: 'http://example.com/dark.jpg' }],
        card_sets: [{ set_name: 'Magician', set_code: 'MAG', set_price: 10.0 }],
      };
      const mockOwners = [
        {
          cantidad: 2,
          condicion: 'Near Mint',
          idioma: 'Inglés',
          users: {
            username: 'johndoe',
            instagram: '@john',
            twitter: '@johndoe',
            whatsapp: '+123456789',
            discord: 'john#123',
          },
        },
      ];
      mockPrisma.cards.findUnique.mockResolvedValue(mockCard);
      mockPrisma.inventario.findMany.mockResolvedValue(mockOwners);
      const result = await service.getCardOwners(BigInt(1));
      expect(result).not.toBeNull();
      expect(result!.card.name).toBe('Dark Magician');
      expect(result!.owners).toHaveLength(1);
      expect(result!.owners[0].username).toBe('johndoe');
      expect(result!.owners[0].cantidad).toBe(2);
    });
  });
});
