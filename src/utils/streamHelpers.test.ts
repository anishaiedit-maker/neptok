import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseByteRange,
  isVideoMediaUrl,
  buildR2ObjectKey,
  formatR2MediaUrl,
} from './streamHelpers';

test('parseByteRange parses explicit start-end, open-ended, and suffix ranges', () => {
  assert.deepEqual(parseByteRange(null, 1000), { kind: 'none' });
  assert.deepEqual(parseByteRange('bytes=0-99', 1000), {
    kind: 'range',
    start: 0,
    end: 99,
    length: 100,
  });
  assert.deepEqual(parseByteRange('bytes=500-', 1000), {
    kind: 'range',
    start: 500,
    end: 999,
    length: 500,
  });
  assert.deepEqual(parseByteRange('bytes=800-5000', 1000), {
    kind: 'range',
    start: 800,
    end: 999,
    length: 200,
  });
  assert.deepEqual(parseByteRange('bytes=-250', 1000), {
    kind: 'range',
    start: 750,
    end: 999,
    length: 250,
  });
});

test('parseByteRange rejects out-of-bounds and malformed ranges', () => {
  assert.deepEqual(parseByteRange('bytes=1000-1100', 1000), { kind: 'invalid' });
  assert.deepEqual(parseByteRange('bytes=500-200', 1000), { kind: 'invalid' });
  assert.deepEqual(parseByteRange('items=0-10', 1000), { kind: 'invalid' });
  assert.deepEqual(parseByteRange('bytes=0-10', 0), { kind: 'invalid' });
});

test('isVideoMediaUrl identifies R2 video keys, data URLs, and file extensions', () => {
  assert.equal(isVideoMediaUrl('/api/media/video/123-abc.mp4'), true);
  assert.equal(isVideoMediaUrl('data:video/webm;base64,AAAA'), true);
  assert.equal(isVideoMediaUrl('/api/media/video/clip', 'video/mp4'), true);
  assert.equal(isVideoMediaUrl('/src/assets/images/nepal_profile_banner_1794926293036.jpg'), false);
});

test('buildR2ObjectKey and formatR2MediaUrl sanitize and format clean paths', () => {
  const key = buildR2ObjectKey('video', 'kathmandu.mp4');
  assert.ok(key.startsWith('video/'));
  assert.ok(key.endsWith('.mp4'));
  assert.equal(formatR2MediaUrl('video/clip 1.mp4'), '/api/media/video/clip%201.mp4');
});
