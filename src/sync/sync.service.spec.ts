import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

describe('SyncService', () => {
  let service: SyncService;

  const mockPrisma = {
    sync_log: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    cards: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    card_images: {
      upsert: jest.fn(),
    },
  };

  const mockHttp = {
    axiosRef: {
      get: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HttpService, useValue: mockHttp },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    jest.clearAllMocks();
  });

  describe('triggerSync', () => {
    it('should return sync stats on success', async () => {
      const mockCards = [
        {
          id: 1,
          name: 'Dark Magician',
          type: 'Monster',
          frameType: 'effect',
          desc: 'Classic',
          race: 'Magician',
          atk: 3000,
          def: 2000,
          level: 7,
          attribute: 'dark',
          archetype: 'Dark Magic',
          card_images: [{ image_url: 'http://example.com/dark.jpg' }],
        },
      ];
      mockHttp.axiosRef.get.mockResolvedValue({ data: mockCards });
      mockPrisma.cards.upsert.mockResolvedValue({});
      mockPrisma.cards.findMany.mockResolvedValue([{ id: BigInt(1) }]);
      mockPrisma.sync_log.create.mockResolvedValue({});

      const result = await service.triggerSync();
      expect(result.cards_created).toBeGreaterThanOrEqual(0);
      expect(result.cards_updated).toBeGreaterThanOrEqual(0);
      expect(result.total_cards).toBe(1);
      expect(result.duration_ms).toBeGreaterThan(0);
    });

    it('should log error and throw on API failure', async () => {
      mockHttp.axiosRef.get.mockRejectedValue(new Error('API timeout'));
      mockPrisma.sync_log.create.mockResolvedValue({});

      await expect(service.triggerSync()).rejects.toThrow();
      // Error is thrown, error is logged with failed status
      expect(mockPrisma.sync_log.create).toHaveBeenCalled();
    });
  });

  describe('getLastSyncStatus', () => {
    it('should return message when no sync exists', async () => {
      mockPrisma.sync_log.findFirst.mockResolvedValue(null);
      const result = await service.getLastSyncStatus();
      expect((result as any).message).toBe(
        'No hay sincronizaciones registradas',
      );
    });

    it('should return last sync log entry', async () => {
      const mockLog = {
        synced_at: new Date(),
        cards_created: 100,
        cards_updated: 50,
        status: 'success',
        error_message: null,
        duration_ms: 5000,
      };
      mockPrisma.sync_log.findFirst.mockResolvedValue(mockLog);
      const result = await service.getLastSyncStatus();
      expect((result as any).cards_created).toBe(100);
      expect((result as any).status).toBe('success');
    });
  });
});
