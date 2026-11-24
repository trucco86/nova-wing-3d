import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import {
  GAMEPLAY_CLIP_MAX_SECONDS,
  gameplayClipRange,
  createGameplayReviewClip,
} from '../tools/gameplay-observer-video.mjs';

const run = promisify(execFile);

test('clips include context before a suspicious event and never exceed 12 seconds', () => {
  assert.deepEqual(gameplayClipRange(30, 18), {
    startSeconds: 11,
    durationSeconds: GAMEPLAY_CLIP_MAX_SECONDS,
  });
  assert.deepEqual(gameplayClipRange(4, 2), {
    startSeconds: 0,
    durationSeconds: 4,
  });
  assert.deepEqual(gameplayClipRange(30, 29), {
    startSeconds: 18,
    durationSeconds: GAMEPLAY_CLIP_MAX_SECONDS,
  });
  assert.throws(() => gameplayClipRange(0, 1));
});

test('a real WebM recording becomes a short playable MP4 for human review', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nova-gameplay-clip-test-'));
  try {
    const source = join(dir, 'source.webm');
    const destination = join(dir, 'review.mp4');
    await run(
      'ffmpeg',
      [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=15',
        '-t', '2', '-c:v', 'libvpx', '-b:v', '120k', source,
      ],
      { timeout: 30000 },
    );
    const clip = await createGameplayReviewClip({
      source,
      destination,
      eventSeconds: 1.6,
    });
    assert.ok(clip.durationSeconds <= GAMEPLAY_CLIP_MAX_SECONDS);
    assert.ok((await stat(destination)).size > 1500);
    const { stdout } = await run(
      'ffprobe',
      [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        destination,
      ],
      { timeout: 15000 },
    );
    assert.equal(stdout.trim(), 'h264');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
