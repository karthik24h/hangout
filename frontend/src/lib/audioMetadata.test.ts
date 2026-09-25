import { Buffer, File as NodeFile } from 'node:buffer';
import { expect, it } from 'vitest';
import { readAudioDetails } from './audioMetadata';

// jsdom lacks Blob.stream; Node's File supplies the browser-compatible runtime API.
const File = NodeFile as unknown as typeof globalThis.File;

function taggedFile(cover: boolean) {
  function frame(id: string, body: Buffer) {
    const header = Buffer.alloc(10);
    header.write(id);
    header.writeUInt32BE(body.length, 4);
    return Buffer.concat([header, body]);
  }
  const frames = [
    frame('TIT2', Buffer.from('\0Actual title')),
    frame('TPE1', Buffer.from('\0Actual artist')),
    frame('TALB', Buffer.from('\0Actual album')),
  ];
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=',
    'base64'
  );
  if (cover)
    frames.push(
      frame(
        'APIC',
        Buffer.concat([Buffer.from([0]), Buffer.from('image/png\0'), Buffer.from([3, 0]), png])
      )
    );
  const body = Buffer.concat(frames);
  const header = Buffer.from([
    73,
    68,
    51,
    3,
    0,
    0,
    (body.length >> 21) & 127,
    (body.length >> 14) & 127,
    (body.length >> 7) & 127,
    body.length & 127,
  ]);
  return { file: new File([header, body], 'filename.mp3', { type: 'audio/mpeg' }), png };
}
it('extracts actual embedded tags and artwork', async () => {
  const { file, png } = taggedFile(true);
  const details = await readAudioDetails(file);
  expect(details.title).toBe('Actual title');
  expect(details.artist).toBe('Actual artist');
  expect(details.album).toBe('Actual album');
  expect(details.artwork?.type).toBe('image/png');
  expect(details.artwork?.size).toBe(png.length);
});
it('retains tags without embedded artwork', async () => {
  const details = await readAudioDetails(taggedFile(false).file);
  expect(details.title).toBe('Actual title');
  expect(details.artwork).toBeUndefined();
});
it('falls back for unreadable files', async () => {
  expect(await readAudioDetails(new File(['invalid'], 'broken.mp3'))).toEqual({});
});
