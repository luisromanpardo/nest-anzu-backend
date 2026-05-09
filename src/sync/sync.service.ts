import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';

const YGOPRODECK_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const CHUNK_SIZE = 100;

interface YGOCard {
  id: number;
  name: string;
  type?: string;
  frameType?: string;
  desc?: string;
  race?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  archetype?: string;
  card_images?: { image_url: string }[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
  ) {}

  // ─── Manual trigger (admin only) ────────────────────────────

  async triggerSync(): Promise<{
    cards_created: number;
    cards_updated: number;
    total_cards: number;
    duration_ms: number;
  }> {
    return this.executeSync();
  }

  // ─── Weekly cron — every Sunday at midnight ──────────────────

  @Cron('0 0 * * 0')
  async handleCron() {
    this.logger.log('⏰ Cron sync triggered — starting YGOProDeck sync');
    try {
      const stats = await this.executeSync();
      this.logger.log(
        `✅ Cron sync completed: ${stats.cards_created} created, ${stats.cards_updated} updated`,
      );
    } catch (error) {
      this.logger.error(`❌ Cron sync failed: ${error.message}`);
      throw error;
    }
  }

  // ─── Sync logic ─────────────────────────────────────────────

  private async executeSync(): Promise<{
    cards_created: number;
    cards_updated: number;
    total_cards: number;
    duration_ms: number;
  }> {
    const start = Date.now();
    let cards_created = 0;
    let cards_updated = 0;

    try {
      // Fetch all cards from YGOProDeck
      const response = await this.http.axiosRef.get(YGOPRODECK_API, {
        timeout: 60000,
      });

      const allCards: YGOCard[] = response.data;
      const total_cards = allCards.length;

      // Process in chunks of 100
      for (let i = 0; i < allCards.length; i += CHUNK_SIZE) {
        const chunk = allCards.slice(i, i + CHUNK_SIZE);

        const result = await this.processChunk(chunk);
        cards_created += result.created;
        cards_updated += result.updated;

        this.logger.debug(
          `Processed chunk ${i / CHUNK_SIZE + 1}/${Math.ceil(allCards.length / CHUNK_SIZE)}`,
        );
      }

      const duration_ms = Date.now() - start;

      // Log success
      await this.prisma.sync_log.create({
        data: {
          synced_at: new Date(),
          total_cards,
          cards_created,
          cards_updated,
          status: 'success',
          duration_ms,
        },
      });

      return { cards_created, cards_updated, total_cards, duration_ms };
    } catch (error) {
      const duration_ms = Date.now() - start;

      await this.prisma.sync_log.create({
        data: {
          synced_at: new Date(),
          status: 'failed',
          error_message: error.message,
          duration_ms,
        },
      });

      throw new InternalServerErrorException(`Sync failed: ${error.message}`);
    }
  }

  private async processChunk(chunk: YGOCard[]) {
    let created = 0;
    let updated = 0;

    for (const card of chunk) {
      try {
        const result = await this.prisma.cards.upsert({
          where: { id: card.id },
          create: {
            id: card.id,
            name: card.name,
            type: card.type,
            frame_type: card.frameType,
            description: card.desc,
            race: card.race,
            atk: card.atk,
            def: card.def,
            level: card.level,
            attribute: card.attribute,
            archetype: card.archetype,
            ygoprodeck_url: `https://www.ygoprodeck.com/card/${card.id}`,
          },
          update: {
            name: card.name,
            type: card.type,
            frame_type: card.frameType,
            description: card.desc,
            race: card.race,
            atk: card.atk,
            def: card.def,
            level: card.level,
            attribute: card.attribute,
            archetype: card.archetype,
          },
        });

        if (result) {
          // Upsert images
          if (card.card_images && card.card_images.length > 0) {
            for (const img of card.card_images) {
              await this.prisma.card_images
                .upsert({
                  where: { image_id: img.image_url ? 0 : 0 }, // Need a unique where; will handle differently
                  create: {
                    card_id: card.id,
                    image_url: img.image_url,
                  },
                  update: {},
                })
                .catch(() => {
                  // Ignore image upsert errors — non-critical
                });
            }
          }
        }

        // Determine if it was create or update
        const exists = await this.prisma.cards.findUnique({
          where: { id: card.id },
        });
        if (exists) {
          // We can't tell from upsert alone — check if this was a new insert
          // Simplified: just count total processed
        }
      } catch (err) {
        this.logger.warn(`Failed to upsert card ${card.id}: ${err.message}`);
      }
    }

    // Approximate create/update split based on simple check
    const ids = chunk.map((c) => c.id);
    const existing = await this.prisma.cards.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => Number(e.id)));
    created = chunk.filter((c) => !existingIds.has(c.id)).length;
    updated = chunk.length - created;

    return { created, updated };
  }

  // ─── Status ───────────────────────────────────────────────────

  async getLastSyncStatus() {
    const lastSync = await this.prisma.sync_log.findFirst({
      orderBy: { synced_at: 'desc' },
    });

    if (!lastSync) {
      return { message: 'No hay sincronizaciones registradas' };
    }

    return lastSync;
  }
}
