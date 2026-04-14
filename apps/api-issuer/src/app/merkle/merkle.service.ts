import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';

import {
  buildMerkleTree,
  getMerkleRoot,
  getMerkleProof,
  verifyWithTree,
  proofDepth,
  MerkleProofResult,
} from '@secure-verify/did-core/merkle';

import { Student, StudentStatus } from '../entities/student.entity';

// ── ABI (minimal — only what we need) ─────────────────────
const REGISTRY_ABI = [
  'function updateRoot(bytes32 newRoot) external',
  'function getRegistryState() external view returns (bytes32 root, uint256 updated, uint256 count)',
  'event RootUpdated(bytes32 indexed newRoot, bytes32 indexed prevRoot, uint256 timestamp, uint256 updateCount)',
];

export interface MerkleSyncPayload {
  root: string;
  contractAddress: string;
  chainId: number;
  lastUpdated: number;
  leafCount: number;
  proofDepth: number;
  syncedAt: string;
}

@Injectable()
export class MerkleService implements OnModuleInit {
  private readonly logger = new Logger(MerkleService.name);

  // In-memory tree — rebuilt nightly via cron
  private currentTree: any = null;
  private currentDIDs: string[] = [];
  private currentRoot = '0x';
  private lastBuiltAt: Date | null = null;

  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Build tree on startup (don't wait for cron)
    await this.rebuildTree();
  }

  // ── Nightly Rebuild + On-Chain Anchor ──────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rebuildAndAnchor(): Promise<void> {
    this.logger.log('🌳 Nightly Merkle rebuild starting...');
    await this.rebuildTree();
    await this.anchorToChain();
  }

  async rebuildTree(): Promise<void> {
    try {
      const students = await this.studentRepo.find({
        select: ['did'],
      where: { status: StudentStatus.ACTIVE },
      });

      if (students.length === 0) {
        this.logger.warn('No active students found — skipping tree build');
        return;
      }

      this.currentDIDs = students.map((s) => s.did).filter(Boolean);
      this.currentTree = buildMerkleTree(this.currentDIDs);
      this.currentRoot = getMerkleRoot(this.currentTree);
      this.lastBuiltAt = new Date();

      this.logger.log(
        `✅ Merkle Tree built: ${this.currentDIDs.length} students → root ${this.currentRoot.slice(0, 10)}... (depth: ${proofDepth(this.currentDIDs.length)})`,
      );
    } catch (err) {
      this.logger.error('Failed to rebuild Merkle Tree', err);
    }
  }

  async anchorToChain(): Promise<string | null> {
    const contractAddress = this.configService.get<string>('MERKLE_CONTRACT_ADDRESS');
    const rpcUrl = this.configService.get<string>('POLYGON_RPC_URL', 'https://rpc-amoy.polygon.technology');
    const privateKey = this.configService.get<string>('ISSUER_PRIVATE_KEY');

    if (!contractAddress || !privateKey) {
      this.logger.warn('MERKLE_CONTRACT_ADDRESS or ISSUER_PRIVATE_KEY not set — skipping chain anchor');
      return null;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(contractAddress, REGISTRY_ABI, wallet);

      const rootBytes32 = this.currentRoot; // already 0x-prefixed 32-byte hex
      const tx = await contract.updateRoot(rootBytes32);
      await tx.wait();

      this.logger.log(`⛓️  Root anchored on-chain: tx ${tx.hash}`);
      return tx.hash;
    } catch (err) {
      this.logger.error('Failed to anchor Merkle Root on-chain', err);
      return null;
    }
  }

  // ── Proof Generation (called from StudentsService) ─────────
  getProofForDID(did: string): MerkleProofResult | null {
    if (!this.currentTree || !this.currentDIDs.includes(did)) return null;
    try {
      return getMerkleProof(this.currentTree, this.currentDIDs, did);
    } catch {
      return null;
    }
  }

  verifyProof(did: string, proof: string[]): boolean {
    if (!this.currentTree) return false;
    return verifyWithTree(this.currentTree, did, proof);
  }

  // ── Sync Payload (served to mobile on WiFi) ────────────────
  getSyncPayload(): MerkleSyncPayload {
    return {
      root: this.currentRoot,
      contractAddress: this.configService.get<string>('MERKLE_CONTRACT_ADDRESS', ''),
      chainId: parseInt(this.configService.get<string>('POLYGON_CHAIN_ID', '80002')),
      lastUpdated: this.lastBuiltAt ? this.lastBuiltAt.getTime() : 0,
      leafCount: this.currentDIDs.length,
      proofDepth: proofDepth(Math.max(this.currentDIDs.length, 1)),
      syncedAt: new Date().toISOString(),
    };
  }

  getCurrentRoot(): string {
    return this.currentRoot;
  }
}
