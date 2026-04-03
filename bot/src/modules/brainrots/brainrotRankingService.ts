import type { BrainrotRecord } from '../../core/types.js';
import { BrainrotRepository } from './brainrotRepository.js';

export interface BrainrotRankingEntry {
  brainrot: BrainrotRecord;
  rarityScore: number;
  ownerCount: number;
  totalOwned: number;
}

export interface BrainrotRankingView {
  entries: BrainrotRankingEntry[];
  limit: number;
}

export class BrainrotRankingService {
  public constructor(private readonly brainrotRepository: BrainrotRepository) {}

  public getTopBrainrots(limit: number): BrainrotRankingView {
    return {
      entries: this.brainrotRepository.getTopWantedBrainrots(limit),
      limit
    };
  }
}
