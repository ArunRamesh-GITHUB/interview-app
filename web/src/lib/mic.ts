// web/src/lib/mic.ts
export function pickRecorderMime(): string {
  // Try best → fallback gracefully (Safari tends to prefer mp4; Chrome likes webm)
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',          // Safari/iOS
    'audio/mpeg',         // MP3 fallback
    ''                    // Let browser choose default
  ];
  for (const t of candidates) {
    try {
      if (!t) return ''; // let the browser pick
      if (typeof (window as any).MediaRecorder !== 'undefined' &&
          (window as any).MediaRecorder.isTypeSupported?.(t)) {
        return t;
      }
    } catch {}
  }
  return '';
}

export function pickFileExt(mime: string): string {
  if (!mime) return 'webm';
  if (mime.includes('mp4')) return 'm4a';
  if (mime.includes('mpeg')) return 'mp3';
  if (mime.includes('webm')) return 'webm';
  return 'webm';
}

export async function getMicStream(): Promise<MediaStream> {
  // Friendly constraints that work well on Android+iOS
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      // channelCount: 1, // uncomment if you still see hardware allocation errors
    } as any,
    // video: false
  };
  // Must be called from a user gesture (click/tap) on iOS
  return await navigator.mediaDevices.getUserMedia(constraints);
}