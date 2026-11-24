import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
export const GAMEPLAY_CLIP_MAX_SECONDS = 12;

export function gameplayClipRange(
  durationSeconds,
  eventSeconds,
  limitSeconds = GAMEPLAY_CLIP_MAX_SECONDS,
) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
    throw new Error('Invalid WebGL recording duration');
  const length = Math.min(durationSeconds, Math.max(1, limitSeconds));
  const event = Number.isFinite(eventSeconds)
    ? Math.max(0, Math.min(durationSeconds, eventSeconds))
    : durationSeconds;
  // Keep up to seven seconds of context before the first suspicious moment.
  const startSeconds = Math.min(Math.max(0, event - 7), Math.max(0, durationSeconds - length));
  return {
    startSeconds,
    durationSeconds: Math.min(length, durationSeconds - startSeconds),
  };
}

export async function createGameplayReviewClip({ source, destination, eventSeconds }) {
  if (!source || !destination) throw new Error('Source and destination are required');
  const { stdout } = await run(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      source,
    ],
    { timeout: 15000 },
  );
  const duration = Number(stdout.trim());
  const range = gameplayClipRange(duration, eventSeconds);
  await run(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-ss',
      range.startSeconds.toFixed(3),
      '-i',
      source,
      '-t',
      range.durationSeconds.toFixed(3),
      '-map',
      '0:v:0',
      '-vf',
      'scale=960:-2:force_original_aspect_ratio=decrease,fps=15',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '30',
      '-an',
      '-movflags',
      '+faststart',
      destination,
    ],
    { timeout: 40000 },
  );
  return { ...range, file: destination, codec: 'H.264', format: 'mp4' };
}
