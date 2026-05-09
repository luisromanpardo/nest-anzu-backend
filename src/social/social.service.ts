import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Follow ──────────────────────────────────────────────────

  async follow(followerId: number, followingId: number) {
    // Cannot follow yourself
    if (followerId === followingId) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }

    // Target user must exist
    const targetUser = await this.prisma.users.findUnique({
      where: { id: followingId },
      select: { id: true },
    });
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Already following?
    const existing = await this.prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Ya sigues a este usuario');
    }

    await this.prisma.user_follows.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
      },
    });

    return { message: 'Ahora sigues a este usuario' };
  }

  async unfollow(followerId: number, followingId: number) {
    const existing = await this.prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('No sigues a este usuario');
    }

    await this.prisma.user_follows.delete({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        },
      },
    });

    return { message: 'Has dejado de seguir a este usuario' };
  }

  // ─── Followers list ───────────────────────────────────────────

  async getFollowers(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.user_follows.findMany({
        where: { following_id: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              role: true,
              is_public: true,
              created_at: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user_follows.count({ where: { following_id: userId } }),
    ]);

    return {
      data: followers.map((f) => f.follower),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowing(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.user_follows.findMany({
        where: { follower_id: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              role: true,
              is_public: true,
              created_at: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user_follows.count({ where: { follower_id: userId } }),
    ]);

    return {
      data: following.map((f) => f.following),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Counts ──────────────────────────────────────────────────

  async getFollowCounts(userId: number) {
    const [followerCount, followingCount] = await Promise.all([
      this.prisma.user_follows.count({ where: { following_id: userId } }),
      this.prisma.user_follows.count({ where: { follower_id: userId } }),
    ]);
    return { follower_count: followerCount, following_count: followingCount };
  }
}
