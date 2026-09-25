export type AudioDetails = {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: Blob;
};

// Tag parsing stays on this device and is loaded only when files are added.
export async function readAudioDetails(file: Blob): Promise<AudioDetails> {
  try {
    const { parseBlob, selectCover } = await import('music-metadata');
    const { common } = await parseBlob(file, { duration: false });
    const cover = selectCover(common.picture);
    return {
      title: common.title?.trim() || undefined,
      artist: common.artist?.trim() || undefined,
      album: common.album?.trim() || undefined,
      artwork:
        cover && /^image\/(jpeg|png|webp|gif)$/i.test(cover.format)
          ? new Blob([new Uint8Array(cover.data)], { type: cover.format })
          : undefined,
    };
  } catch {
    // Missing or damaged tags should never prevent playback.
    return {};
  }
}
