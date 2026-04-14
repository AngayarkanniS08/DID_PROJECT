import { Controller, Get, Post, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/Jwt-auth.guard';
import { MerkleService, MerkleSyncPayload } from './merkle.service';

@Controller('merkle')
export class MerkleController {
  private readonly logger = new Logger(MerkleController.name);

  constructor(private readonly merkleService: MerkleService) {}

  /**
   * GET /merkle/sync
   * Called by the Verifier app on morning WiFi sync.
   * Returns current root + contract address for offline cache.
   * No auth required — root is public by nature (it's on-chain).
   */
  @Get('sync')
  getSyncPayload(): MerkleSyncPayload {
    return this.merkleService.getSyncPayload();
  }

  /**
   * GET /merkle/root
   * Quick endpoint for debugging — returns current root only.
   */
  @Get('root')
  getRoot(): { root: string } {
    return { root: this.merkleService.getCurrentRoot() };
  }

  /**
   * POST /merkle/rebuild
   * Admin trigger to rebuild tree + anchor immediately (e.g., after bulk import).
   * Protected by JWT.
   */
  @Post('rebuild')
  @UseGuards(JwtAuthGuard)
  async triggerRebuild(): Promise<{ success: boolean; txHash: string | null; root: string }> {
    this.logger.log('Manual rebuild triggered via API');
    await this.merkleService.rebuildTree();
    const txHash = await this.merkleService.anchorToChain();
    return {
      success: true,
      txHash,
      root: this.merkleService.getCurrentRoot(),
    };
  }
}
