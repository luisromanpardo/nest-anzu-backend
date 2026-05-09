import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('SocialService', () => {
  let service: SocialService;
  let prisma: PrismaService;

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
    },
    user_follows: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should throw BadRequestException when following self', async () => {
      await expect(service.follow(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      mockPrisma.users.findUnique.mockResolvedValue(null);
      await expect(service.follow(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already following', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.user_follows.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.follow(1, 2)).rejects.toThrow(ConflictException);
    });

    it('should create follow relationship successfully', async () => {
      mockPrisma.users.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.user_follows.findUnique.mockResolvedValue(null);
      mockPrisma.user_follows.create.mockResolvedValue({});
      const result = await service.follow(1, 2);
      expect(result.message).toBe('Ahora sigues a este usuario');
      expect(mockPrisma.user_follows.create).toHaveBeenCalled();
    });
  });

  describe('unfollow', () => {
    it('should throw NotFoundException when not following', async () => {
      mockPrisma.user_follows.findUnique.mockResolvedValue(null);
      await expect(service.unfollow(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('should delete follow relationship successfully', async () => {
      mockPrisma.user_follows.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.user_follows.delete.mockResolvedValue({});
      const result = await service.unfollow(1, 2);
      expect(result.message).toBe('Has dejado de seguir a este usuario');
      expect(mockPrisma.user_follows.delete).toHaveBeenCalled();
    });
  });

  describe('getFollowers', () => {
    it('should return paginated followers list', async () => {
      const mockFollowers = [
        {
          follower: {
            id: 2,
            username: 'user2',
            role: 'user',
            is_public: true,
            created_at: new Date(),
          },
        },
      ];
      mockPrisma.user_follows.findMany.mockResolvedValue(mockFollowers);
      mockPrisma.user_follows.count.mockResolvedValue(1);

      const result = await service.getFollowers(1, 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following list', async () => {
      const mockFollowing = [
        {
          following: {
            id: 2,
            username: 'user2',
            role: 'user',
            is_public: true,
            created_at: new Date(),
          },
        },
      ];
      mockPrisma.user_follows.findMany.mockResolvedValue(mockFollowing);
      mockPrisma.user_follows.count.mockResolvedValue(1);

      const result = await service.getFollowing(1, 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getFollowCounts', () => {
    it('should return follower and following counts', async () => {
      mockPrisma.user_follows.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10);
      const result = await service.getFollowCounts(1);
      expect(result.follower_count).toBe(5);
      expect(result.following_count).toBe(10);
    });
  });
});
