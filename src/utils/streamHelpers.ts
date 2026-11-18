export type ByteRangeParseResult =
  | { kind: 'none' }
  | { kind: 'invalid' }
  | { kind: 'range'; start: number; end: number; length: number };

/**
 * Pure RFC 9110 HTTP Range header parser for R2 & local byte-streaming.
 */
export function parseByteRange(
  rangeHeader: string | null | undefined,
  totalSize: number
): ByteRangeParseResult {
  if (!rangeHeader) return { kind: 'none' };
  const safeTotal = Math.max(0, Math.floor(totalSize));
  if (safeTotal === 0) return { kind: 'invalid' };

  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return { kind: 'invalid' };

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return { kind: 'invalid' };

  let start: number;
  let end: number;

  if (!rawStart && rawEnd) {
    // Suffix byte range: bytes=-500
    const suffixLen = Number(rawEnd);
    if (!Number.isFinite(suffixLen) || suffixLen <= 0) return { kind: 'invalid' };
    start = Math.max(0, safeTotal - suffixLen);
    end = safeTotal - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Math.min(safeTotal - 1, Number(rawEnd)) : safeTotal - 1;
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start >= safeTotal ||
    end < start
  ) {
    return { kind: 'invalid' };
  }

  return {
    kind: 'range',
    start,
    end,
    length: end - start + 1,
  };
}

export function isVideoMediaUrl(url: string, mediaMime?: string | null): boolean {
  if (!url) return false;
  if (mediaMime && mediaMime.toLowerCase().startsWith('video/')) return true;
  if (url.startsWith('data:video/')) return true;
  if (/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url)) return true;
  if (url.includes('#video') || url.includes('kind=video')) return true;
  return false;
}

export function buildR2ObjectKey(kind: string, filename: string): string {
  const safeKind = kind.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'media';
  const extMatch = /\.([a-z0-9]{1,8})$/i.exec(filename || '');
  const ext = extMatch ? extMatch[1].toLowerCase() : 'bin';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${safeKind}/${Date.now()}-${rand}.${ext}`;
}

export function formatR2MediaUrl(key: string): string {
  const encoded = key
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `/api/media/${encoded}`;
}
