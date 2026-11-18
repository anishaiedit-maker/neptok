import { GoogleGenAI, Type } from '@google/genai';
import {
  runRuleBasedSafetyPrecheck,
  type ModerationScanVerdict,
} from '../src/utils/neptokLogic';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function askNepTokSupportAI(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  language?: 'en' | 'ne';
  userContext?: {
    username: string;
    followers: number;
    coins: number;
    creatorBalanceUsd: number;
  };
}): Promise<{ reply: string; escalateSuggested: boolean }> {
  const ai = createGeminiClient();
  if (!ai) {
    throw new Error(
      'GEMINI_API_KEY is not configured in Settings > Secrets. Please attach an API key to enable live AI Support responses.'
    );
  }

  const systemInstruction = `You are the official 24/7 NepTok Support AI Assistant ("NepTok Help Center AI").
NepTok is Nepal's Social & Live Platform.
Key platform policies and facts you must always follow:
- Currency is strictly USD ($) and NepTok Coins (N) where 100 Coins = $1.00. Never mention AED.
- Live streaming modes are called "NEP Live" and "NEP Battle" (never "PK" or "PK Battle").
- Creator Monetization requires a minimum of 5,000 Followers + Good Account Standing. There are two modules: Content Monetization (USD RPM from Videos & Photos) and Gift Monetization (Coin-to-USD payouts).
- Stories remain active for 48 hours.
- Gift Store features 48 original gifts from Double Rose (1 N) to Sagarmatha (1,000 N).
- Audio Live Rooms support Host + up to 30 participants; Video Live Multi-Guest supports up to 8 participants; OBS/RTMP uses rtmp://live.neptok.com/live.
- Payment & withdrawal methods: Visa, Mastercard, PayPal, Google Pay, Apple Pay, Wise, USDT (Crypto), and Bank Transfer.
- User context: @${params.userContext?.username ?? 'neptok_user'}, Followers: ${
    params.userContext?.followers ?? 0
  }, Coins: ${params.userContext?.coins ?? 0} N, Creator Balance: $${
    params.userContext?.creatorBalanceUsd?.toFixed(2) ?? '0.00'
  }.
- Reply language preference: ${params.language === 'ne' ? 'Nepali (नेपाली) with clear English terms where helpful' : 'Clear, concise, friendly English'}.
- Keep responses concise (2-4 short paragraphs or bullet points). If the issue requires human account intervention (e.g., frozen payout dispute or hacked account), mention they can click "Escalate to Human Agent".`;

  const contents = [
    ...(params.history ?? []).map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: params.message }],
    },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents,
    config: {
      systemInstruction,
    },
  });

  const reply = (response.text ?? '').trim();
  if (!reply) {
    throw new Error('Empty response from Gemini AI support model.');
  }

  const escalateSuggested =
    /escalat|human|ticket|dispute|hacked|ban appeal|frozen/i.test(params.message) ||
    /escalat|human agent/i.test(reply);

  return { reply, escalateSuggested };
}

export async function runAICensorshipScan(params: {
  caption: string;
  audioTitle: string;
  mediaType: 'video' | 'reel' | 'photo' | 'story' | 'live';
  simulateFlag?: 'none' | 'copyright' | 'nsfw' | 'violence';
}): Promise<ModerationScanVerdict & { scannedBy: string }> {
  const ruleVerdict = runRuleBasedSafetyPrecheck({
    caption: params.caption,
    audioTitle: params.audioTitle,
    simulateFlag: params.simulateFlag,
  });

  if (ruleVerdict.status !== 'APPROVED') {
    return { ...ruleVerdict, scannedBy: 'NepTok Safety Guard + Rule Matrix' };
  }

  const ai = createGeminiClient();
  if (!ai) {
    return { ...ruleVerdict, scannedBy: 'NepTok Safety Policy Matrix' };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Analyze this NepTok ${params.mediaType} metadata for:
1) Copyrighted third-party commercial music/movie infringement indicators
2) Nudity / NSFW / sexually explicit content
3) Graphic violence, blood, weapons, self-harm, hate speech, or harassment.
Caption: "${params.caption}"
Audio: "${params.audioTitle}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: 'APPROVED, FLAGGED, or BLOCKED' },
            copyrightStatus: {
              type: Type.STRING,
              description: 'CLEAR, MUTED_SEGMENT, or COPYRIGHT_BLOCKED',
            },
            nsfwScore: { type: Type.INTEGER },
            violenceScore: { type: Type.INTEGER },
            copyrightConfidence: { type: Type.INTEGER },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as Partial<ModerationScanVerdict>;
    if (parsed.status === 'APPROVED' || parsed.status === 'FLAGGED' || parsed.status === 'BLOCKED') {
      return {
        status: parsed.status,
        copyrightStatus:
          parsed.copyrightStatus === 'MUTED_SEGMENT' ||
          parsed.copyrightStatus === 'COPYRIGHT_BLOCKED'
            ? parsed.copyrightStatus
            : 'CLEAR',
        nsfwScore: Number(parsed.nsfwScore ?? 1),
        violenceScore: Number(parsed.violenceScore ?? 1),
        copyrightConfidence: Number(parsed.copyrightConfidence ?? 2),
        reasons:
          Array.isArray(parsed.reasons) && parsed.reasons.length > 0
            ? parsed.reasons
            : ['Cleared by Gemini AI Content Safety & Copyright Pipeline'],
        scannedBy: 'Gemini AI Censorship & Copyright Engine',
      };
    }
  } catch {
    // Fall back to deterministic rule verdict if Gemini call fails during publish
  }

  return { ...ruleVerdict, scannedBy: 'NepTok Safety Policy Matrix' };
}

export async function generateNepTokVideo(params: {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
}): Promise<{ videoDataUrl: string; mimeType: string; aspectRatio: '16:9' | '9:16' }> {
  const ai = createGeminiClient();
  if (!ai) {
    throw new Error(
      'Video generation requires a billing-enabled GEMINI_API_KEY in Settings > Secrets.'
    );
  }

  const aspect = params.aspectRatio === '16:9' ? '16:9' : '9:16';
  const interaction = await ai.interactions.create(
    {
      model: 'gemini-omni-1.2-flash',
      input: params.prompt,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: aspect,
        duration: '5s',
        resolution: '720p',
      },
    },
    { timeout: 300000 }
  );

  const videoPart = interaction.output_video;
  if (!videoPart || !videoPart.data) {
    throw new Error('No video output returned by gemini-omni-1.2-flash.');
  }

  const mimeType = videoPart.mime_type || 'video/mp4';
  return {
    videoDataUrl: `data:${mimeType};base64,${videoPart.data}`,
    mimeType,
    aspectRatio: aspect,
  };
}

