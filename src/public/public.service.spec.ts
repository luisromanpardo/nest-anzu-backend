import { Test, TestingModule } from '@nestjs/testing';
import { PublicService } from './public.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PublicService', () => {
  let service: PublicService;

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
    },
    inventario: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
    jest.clearAllMocks();
  });

  describe('getProfileByUsername', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      await expect(service.getProfileByUsername('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user is private', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ is_public: false });
      await expect(service.getProfileByUsername('privateuser')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return public profile with inventory', async () => {
      const mockUser = {
        id: 1,
        username: 'johndoe',
        role: 'user',
        is_public: true,
        instagram: '@johndoe',
        twitter: '@johndoe',
        facebook: null,
        whatsapp: '+123456789',
        discord: 'john#1234',
        konami_id: 'KONAMI123',
        created_at: new Date('2025-01-01'),
        _count: { inventario: 2 },
      };
      const mockInventory = [
        {
          inventario_id: 1,
          card_id: BigInt(100),
          cantidad: 1,
          condicion: 'Near Mint',
          idioma: 'Inglés',
          edicion: '1st Edition',
          cards: {
            id: BigInt(100),
            name: 'Dark Magician',
            type: 'Monster',
            archetype: 'Dark Magic',
            frame_type: 'effect',
            attribute: 'dark',
            card_images: [{ image_url: 'http://example.com/dark.jpg' }],
          },
        },
      ];
      mockPrisma.users.findUnique.mockResolvedValue(mockUser);
      mockPrisma.inventario.findMany.mockResolvedValue(mockInventory);
      const result = await service.getProfileByUsername('johndoe');
      expect(result.username).toBe('johndoe');
      expect(result.card_count).toBe(2);
      expect(result.inventory).toHaveLength(1);
      expect(result.social.instagram).toBe('@johndoe');
    });
  });
});
