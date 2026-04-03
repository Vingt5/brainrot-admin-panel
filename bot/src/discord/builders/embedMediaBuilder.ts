import { AttachmentBuilder } from 'discord.js';
import { basename } from 'node:path';

import { assertLocalAssetExists, isRemoteAssetUrl } from '../../utils/assets.js';

export interface BuiltEmbedMedia {
  readonly source: string;
  readonly files: AttachmentBuilder[];
}

export function buildEmbedMedia(imageUrl: string): BuiltEmbedMedia {
  if (isRemoteAssetUrl(imageUrl)) {
    return {
      source: imageUrl,
      files: []
    };
  }

  const absolutePath = assertLocalAssetExists(imageUrl);
  const fileName = basename(absolutePath);

  return {
    source: `attachment://${fileName}`,
    files: [new AttachmentBuilder(absolutePath, { name: fileName })]
  };
}
