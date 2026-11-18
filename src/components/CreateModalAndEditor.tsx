import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Film,
  Image as ImageIcon,
  Clock,
  X,
  Zap,
  Timer,
  RefreshCw,
  Sliders,
  Sparkles,
  Upload,
  Camera,
  Scissors,
  Play,
  Pause,
  Maximize2,
  Sticker,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Layers,
  Wand2,
  Music,
  Mic,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  RotateCcw,
  Undo2,
  Redo2,
  EyeOff,
  Plus,
  Type,
  Copy,
  CopyPlus,
  MoveHorizontal,
  Activity,
  SlidersHorizontal,
  ArrowRight,
  ChevronLeft,
  Hash,
  Tag,
  ScissorsLineDashed,
  ImagePlus,
  Gauge,
} from 'lucide-react';
import {
  CAMERA_EFFECTS_60,
  POST_FILTERS_80,
  POST_STICKERS_120,
  DEFAULT_LUMETRI,
  PLAYBACK_SPEED_OPTIONS,
  clampPlaybackSpeed,
  buildVideoCssFilter,
  splitTimelineClipAtTime,
  trimOrExtendTimelineClip,
  moveTimelineClip,
  calculateClipsTotalDuration,
  duplicateTimelineClip,
  slipTimelineClip,
  generateBeatMarkers,
  type TimelineClip,
  type HslColorKey,
  type LumetriAdjustments,
  type PostVisibility,
} from '../utils/neptokLogic';
import type { CreateOption, FeedPost, OriginalSound, StoryItem } from '../types/neptok';
import { uploadMediaFile } from '../utils/apiClient';
import { isVideoMediaUrl } from '../utils/streamHelpers';

interface CreateModalAndEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialOption?: CreateOption | null;
  initialSound?: OriginalSound | null;
  editingPost?: FeedPost | null;
  duetPost?: FeedPost | null;
  communitySounds?: OriginalSound[];
  currentUser: { id: string; name: string; handle: string };
  onPublishPost: (post: FeedPost) => void;
  onSaveDraft?: (draft: FeedPost) => void;
  onPublishStory: (story: StoryItem) => void;
  onNotify: (msg: string) => void;
}

type EditorToolTab =
  | 'adjust'
  | 'lumetri'
  | 'filters'
  | 'skin'
  | 'retouch'
  | 'text'
  | 'templates'
  | 'effects'
  | 'stickers'
  | 'ai-video';

type BottomToolbarTool =
  | 'none'
  | 'green-screen'
  | 'overlay'
  | 'audio'
  | 'sfx'
  | 'fade'
  | 'volume'
  | 'edit'
  | 'slip';

interface AudioClipSegment extends TimelineClip {
  url?: string;
  muted: boolean;
  isVoiceover?: boolean;
}

interface AudioTrackSlot {
  id: 'a1' | 'a2';
  label: 'Audio 1' | 'Audio 2';
  visible: boolean;
  muted: boolean;
  segments: AudioClipSegment[];
}

interface OverlayTrackItem {
  id: string;
  label: string;
  title: string;
  previewUrl: string;
  visible: boolean;
  muted: boolean;
}

interface EditorSnapshot {
  clips: TimelineClip[];
  lumetri: LumetriAdjustments;
  selectedPostFilterId: string;
  overlayTracks: OverlayTrackItem[];
  textCaption: string;
  textStyle: string;
  textVisible: boolean;
  removeBgEnabled: boolean;
  chromaKey: { enabled: boolean; color: string; intensity: number };
  volumeLevel: number;
  volumeDucking: boolean;
  fadeInSec: number;
  fadeOutSec: number;
  beatMarkers: number[];
  clipSpeed: number;
}

const HSL_COLORS: Array<{ key: HslColorKey; hex: string }> = [
  { key: 'Red', hex: '#EF4444' },
  { key: 'Orange', hex: '#F97316' },
  { key: 'Yellow', hex: '#EAB308' },
  { key: 'Green', hex: '#22C55E' },
  { key: 'Cyan', hex: '#06B6D4' },
  { key: 'Blue', hex: '#3B82F6' },
  { key: 'Purple', hex: '#9D00FF' },
  { key: 'Magenta', hex: '#FF0080' },
];

const LIBRARY_AUDIO_TRACKS = [
  { id: 'lib-1', title: 'Madal & Flute Fusion', durationSec: 32 },
  { id: 'lib-2', title: 'Himalayan Singing Bowl', durationSec: 45 },
  { id: 'lib-3', title: 'Sarangi Acoustic Lo-Fi', durationSec: 28 },
];

const SFX_PRESETS = [
  { id: 'sfx-1', title: 'Cinematic Whoosh', durationSec: 2 },
  { id: 'sfx-2', title: 'Madal Beat Drop', durationSec: 3 },
  { id: 'sfx-3', title: 'Crowd Applause', durationSec: 4 },
  { id: 'sfx-4', title: 'Himalayan Bell Chime', durationSec: 3 },
];

const OVERLAY_PRESETS = [
  {
    id: 'ov-1',
    title: 'Kathmandu Skyline Cutout',
    url: '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
  },
  {
    id: 'ov-2',
    title: 'Phewa Lake Reflection',
    url: '/src/assets/images/creator_pokhara_lake_1794926294810.jpg',
  },
  {
    id: 'ov-3',
    title: 'Everest Ridge Frame',
    url: '/src/assets/images/creator_everest_trek_1794926294520.jpg',
  },
];

export const CreateModalAndEditor: React.FC<CreateModalAndEditorProps> = ({
  isOpen,
  onClose,
  initialOption = null,
  initialSound = null,
  editingPost = null,
  duetPost = null,
  communitySounds = [],
  currentUser,
  onPublishPost,
  onSaveDraft,
  onPublishStory,
  onNotify,
}) => {
  const [selectedOption, setSelectedOption] = useState<CreateOption | null>(initialOption);
  const [stage, setStage] = useState<'selector' | 'camera' | 'editor' | 'publish'>('selector');

  // Pro Camera States
  const [durationLimit, setDurationLimit] = useState<15 | 60>(15);
  const [speed, setSpeed] = useState<0.3 | 0.5 | 1 | 2 | 3>(1);
  const [flashMode, setFlashMode] = useState<'Off' | 'On' | 'Auto'>('Auto');
  const [timerSec, setTimerSec] = useState<0 | 3 | 10>(0);
  const [countdownActive, setCountdownActive] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [facingFront, setFacingFront] = useState(true);
  const [liveEffectIdx, setLiveEffectIdx] = useState(0);
  const [showCameraRetouch, setShowCameraRetouch] = useState(false);
  const [showCameraSoundPicker, setShowCameraSoundPicker] = useState(false);
  const [selectedCameraSound, setSelectedCameraSound] = useState<OriginalSound | null>(initialSound);
  const [camRetouch, setCamRetouch] = useState({
    eyes: 35,
    underEyeAndBody: 45,
    contrastGlow: 30,
    deNoise: 40,
  });

  // Post-Production Video / Photo / Story Editor States
  const [mediaUrl, setMediaUrl] = useState('/src/assets/images/creator_dance_kathmandu_1794926294158.jpg');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaMime, setMediaMime] = useState<string | undefined>(undefined);
  const [r2Key, setR2Key] = useState<string | undefined>(undefined);
  const [thumbnailUrl, setThumbnailUrl] = useState('/src/assets/images/creator_dance_kathmandu_1794926294158.jpg');
  const pendingUploadsRef = useRef<Set<Promise<void>>>(new Set());
  const latestMediaUrlRef = useRef('/src/assets/images/creator_dance_kathmandu_1794926294158.jpg');
  const latestThumbUrlRef = useRef('/src/assets/images/creator_dance_kathmandu_1794926294158.jpg');
  const latestMediaMimeRef = useRef<string | undefined>(undefined);
  const latestR2KeyRef = useRef<string | undefined>(undefined);

  const trackUploadPromise = (p: Promise<void>) => {
    pendingUploadsRef.current.add(p);
    p.finally(() => {
      pendingUploadsRef.current.delete(p);
    });
  };
  const [caption, setCaption] = useState('');
  const [hashtagsList, setHashtagsList] = useState<string[]>(['#NepTok', '#Nepal', '#8KStudio']);
  const [hashtagInput, setHashtagInput] = useState('');
  const [tagsList, setTagsList] = useState<string[]>(['Kathmandu', 'CreatorStudio']);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('Everyone');
  const [activeTool, setActiveTool] = useState<EditorToolTab>('adjust');
  const [selectedPostFilterId, setSelectedPostFilterId] = useState<string>(POST_FILTERS_80[0].id);
  const [filterIntensity, setFilterIntensity] = useState(85);
  const [faceMaskEnabled, setFaceMaskEnabled] = useState(true);
  const [postRetouch, setPostRetouch] = useState({
    skinSmooth: 42,
    blemishRemove: 38,
    faceGlow: 35,
    eyesRetouch: 30,
    skinToneBalance: 25,
  });
  const [lumetri, setLumetri] = useState<LumetriAdjustments>(DEFAULT_LUMETRI);
  const [activeHslColor, setActiveHslColor] = useState<HslColorKey>('Red');
  const [selectedSticker, setSelectedSticker] = useState<string>('');
  const [selectedEffectOverlay, setSelectedEffectOverlay] = useState<string>('None');
  const [storyTemplate, setStoryTemplate] = useState<string>('Neon Kathmandu Frame');
  const [isPlaying, setIsPlaying] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [transitionType, setTransitionType] = useState('Cross Dissolve');

  // Stacked Multi-Track Timeline State:
  // Top->Bottom: Overlay/Cutout tracks -> Text/Caption track -> Main Video Track (V1) -> Audio 1 & Audio 2 (underneath V1)
  const [timelineMaxSec, setTimelineMaxSec] = useState(60);
  const [playhead, setPlayhead] = useState(12);
  const [clips, setClips] = useState<TimelineClip[]>([
    { id: 'clip-1', label: 'Main Video', start: 0, end: 45 },
  ]);
  const [selectedClipId, setSelectedClipId] = useState<string>('clip-1');
  const [selectedAudioTarget, setSelectedAudioTarget] = useState<{
    trackIdx: 0 | 1;
    clipId: string;
  } | null>(null);
  const [activeTrackKind, setActiveTrackKind] = useState<'video' | 'audio'>('video');
  const [quickToolMode, setQuickToolMode] = useState<'none' | 'speed' | 'move'>('none');
  const [clipSpeed, setClipSpeed] = useState<number>(1);
  const [scrubbingPlayhead, setScrubbingPlayhead] = useState(false);
  const [videoTrackVisible, setVideoTrackVisible] = useState(true);

  const [overlayTracks, setOverlayTracks] = useState<OverlayTrackItem[]>([
    {
      id: 'ov-track-1',
      label: 'Overlay 1',
      title: 'NepTok Neon Frame',
      previewUrl: '/src/assets/images/nepal_profile_banner_1794926293036.jpg',
      visible: false,
      muted: false,
    },
  ]);

  const [textCaption, setTextCaption] = useState('Namaste Nepal 🇳🇵');
  const [textStyle, setTextStyle] = useState<'Neon Glow' | 'Minimal Bold' | 'Subtitle Box'>('Neon Glow');
  const [textVisible, setTextVisible] = useState(false);
  const [textMuted, setTextMuted] = useState(false);

  // Audio 1 & Audio 2 strictly separated underneath V1, supporting independent segments, trim/extend, move & split
  const [audioTracks, setAudioTracks] = useState<AudioTrackSlot[]>([
    {
      id: 'a1',
      label: 'Audio 1',
      visible: true,
      muted: false,
      segments: [
        {
          id: 'a1-seg-1',
          label: initialSound?.title || 'Madal & Flute Fusion',
          start: 2,
          end: 40,
          muted: false,
        },
      ],
    },
    {
      id: 'a2',
      label: 'Audio 2',
      visible: true,
      muted: false,
      segments: [],
    },
  ]);
  const [dragState, setDragState] = useState<{
    kind: 'video' | 'audio';
    trackIdx?: 0 | 1;
    clipId: string;
    edge: 'start' | 'end' | 'move';
    startX: number;
    laneWidth: number;
    origClips: TimelineClip[];
    origAudioSegs?: AudioClipSegment[];
  } | null>(null);
  const [targetAudioTrackIdx, setTargetAudioTrackIdx] = useState<0 | 1>(0);
  const [libraryPickerTrackIdx, setLibraryPickerTrackIdx] = useState<0 | 1 | null>(null);
  const [stickerSearch, setStickerSearch] = useState('');

  // Working Bottom Toolbar States + Undo/Redo History Stack
  const [activeBottomTool, setActiveBottomTool] = useState<BottomToolbarTool>('none');
  const [removeBgEnabled, setRemoveBgEnabled] = useState(false);
  const [chromaKey, setChromaKey] = useState({ enabled: false, color: '#22C55E', intensity: 55 });
  const [fadeInSec, setFadeInSec] = useState(0);
  const [fadeOutSec, setFadeOutSec] = useState(0);
  const [volumeDucking, setVolumeDucking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(100);
  const [beatMarkers, setBeatMarkers] = useState<number[]>([]);
  const [copiedClipBuffer, setCopiedClipBuffer] = useState<TimelineClip | null>(null);
  const [historyPast, setHistoryPast] = useState<EditorSnapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<EditorSnapshot[]>([]);

  // Live Voiceover Mic Recorder (Audio 1 or Audio 2)
  const [recordingTrackIdx, setRecordingTrackIdx] = useState<0 | 1 | null>(null);
  const [voiceoverElapsed, setVoiceoverElapsed] = useState(0);
  const [voiceoverError, setVoiceoverError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceElapsedRef = useRef(0);

  // AI Video Generation (gemini-omni-1.2-flash)
  const [aiVideoPrompt, setAiVideoPrompt] = useState('');
  const [aiVideoAspect, setAiVideoAspect] = useState<'9:16' | '16:9'>('9:16');
  const [aiVideoLoading, setAiVideoLoading] = useState(false);
  const [aiVideoError, setAiVideoError] = useState<string | null>(null);

  const [safetyScanState, setSafetyScanState] = useState<{
    scanning: boolean;
    verdict?: string;
    blocked?: boolean;
  }>({ scanning: false });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const overlayFileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const editorVideoRef = useRef<HTMLVideoElement | null>(null);
  const playheadRulerRef = useRef<HTMLDivElement | null>(null);
  const [hasLiveWebcam, setHasLiveWebcam] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingPost) {
      setSelectedOption(
        editingPost.type === 'photo'
          ? 'photo'
          : editingPost.type === 'reel'
          ? 'reels'
          : 'video'
      );
      setMediaUrl(editingPost.mediaUrl);
      latestMediaUrlRef.current = editingPost.mediaUrl;
      const thumb = editingPost.thumbnailUrl || editingPost.mediaUrl;
      setThumbnailUrl(thumb);
      latestThumbUrlRef.current = thumb;
      setMediaMime(editingPost.mediaMime);
      latestMediaMimeRef.current = editingPost.mediaMime;
      setR2Key(editingPost.r2Key);
      latestR2KeyRef.current = editingPost.r2Key;
      setMediaType(isVideoMediaUrl(editingPost.mediaUrl, editingPost.mediaMime) ? 'video' : 'image');
      setCaption(editingPost.caption);
      setHashtagsList(editingPost.hashtags.length ? editingPost.hashtags : ['#NepTok']);
      setTagsList(editingPost.tags || ['Kathmandu']);
      setVisibility(editingPost.visibility);
      setStage('editor');
    } else if (duetPost) {
      setSelectedOption('video');
      setMediaUrl(duetPost.mediaUrl);
      latestMediaUrlRef.current = duetPost.mediaUrl;
      setThumbnailUrl(duetPost.mediaUrl);
      latestThumbUrlRef.current = duetPost.mediaUrl;
      setMediaMime(duetPost.mediaMime);
      latestMediaMimeRef.current = duetPost.mediaMime;
      setR2Key(undefined);
      latestR2KeyRef.current = undefined;
      setMediaType(isVideoMediaUrl(duetPost.mediaUrl, duetPost.mediaMime) ? 'video' : 'image');
      setCaption(`Duet with @${duetPost.authorHandle}`);
      setHashtagsList(['#Duet', '#NepTok']);
      setStage('camera');
    } else if (initialOption) {
      setSelectedOption(initialOption);
      setMediaType('image');
      setMediaMime(undefined);
      latestMediaMimeRef.current = undefined;
      setR2Key(undefined);
      latestR2KeyRef.current = undefined;
      setStage(initialOption === 'video' || initialOption === 'reels' ? 'camera' : 'editor');
    } else {
      setSelectedOption(null);
      setMediaType('image');
      setMediaMime(undefined);
      latestMediaMimeRef.current = undefined;
      setR2Key(undefined);
      latestR2KeyRef.current = undefined;
      setStage('selector');
    }
    setSafetyScanState({ scanning: false });
    setVoiceoverError(null);
    setAiVideoError(null);
    setHistoryPast([]);
    setHistoryFuture([]);
  }, [isOpen, initialOption, editingPost, duetPost]);

  // Try connecting camera stream gracefully when in camera mode
  useEffect(() => {
    if (!isOpen || stage !== 'camera') return;
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: facingFront ? 'user' : 'environment' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            setHasLiveWebcam(true);
          }
        })
        .catch(() => {
          setHasLiveWebcam(false);
        });
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      setHasLiveWebcam(false);
    };
  }, [isOpen, stage, facingFront]);

  // Voiceover elapsed timer
  useEffect(() => {
    if (recordingTrackIdx === null) return;
    const id = setInterval(() => {
      setVoiceoverElapsed((prev) => {
        const next = prev + 1;
        voiceElapsedRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [recordingTrackIdx]);

  // Clean up any active mic stream on unmount or close
  useEffect(() => {
    if (!isOpen && voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
      setRecordingTrackIdx(null);
    }
  }, [isOpen]);

  // Countdown timer effect
  useEffect(() => {
    if (countdownActive === null) return;
    if (countdownActive <= 0) {
      setCountdownActive(null);
      setIsRecording(true);
      return;
    }
    const id = setTimeout(() => setCountdownActive((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdownActive]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      setRecordElapsed((prev) => {
        if (prev + 1 >= durationLimit) {
          setIsRecording(false);
          setStage('editor');
          return durationLimit;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording, durationLimit]);

  // Interactive pointer drag for Trim/Shrink, Extend, and Move handles across Video & Audio tracks
  useEffect(() => {
    if (!dragState) return;
    const handlePointerMove = (ev: PointerEvent) => {
      const deltaPx = ev.clientX - dragState.startX;
      const rawSec = (deltaPx / Math.max(120, dragState.laneWidth)) * Math.max(10, timelineMaxSec);
      const deltaSec = Math.round(rawSec * 2) / 2;

      if (dragState.kind === 'video') {
        const nextClips =
          dragState.edge === 'move'
            ? moveTimelineClip(dragState.origClips, dragState.clipId, deltaSec, 180)
            : trimOrExtendTimelineClip(
                dragState.origClips,
                dragState.clipId,
                dragState.edge,
                deltaSec,
                1,
                180
              );
        const maxEnd = nextClips.reduce((m, c) => Math.max(m, c.end), timelineMaxSec);
        if (maxEnd > timelineMaxSec) setTimelineMaxSec(Math.min(180, Math.ceil(maxEnd)));
        setClips(nextClips);
      } else if (dragState.kind === 'audio' && dragState.trackIdx !== undefined && dragState.origAudioSegs) {
        const nextBase =
          dragState.edge === 'move'
            ? moveTimelineClip(dragState.origAudioSegs, dragState.clipId, deltaSec, 180)
            : trimOrExtendTimelineClip(
                dragState.origAudioSegs,
                dragState.clipId,
                dragState.edge,
                deltaSec,
                1,
                180
              );
        const maxEnd = nextBase.reduce((m, c) => Math.max(m, c.end), timelineMaxSec);
        if (maxEnd > timelineMaxSec) setTimelineMaxSec(Math.min(180, Math.ceil(maxEnd)));
        const trackIdx = dragState.trackIdx;
        setAudioTracks((prev) =>
          prev.map((trk, i) => {
            if (i !== trackIdx) return trk;
            return {
              ...trk,
              segments: nextBase.map((nb) => {
                const orig = dragState.origAudioSegs?.find((o) => o.id === nb.id);
                return {
                  ...nb,
                  url: orig?.url,
                  muted: orig?.muted ?? false,
                  isVoiceover: orig?.isVoiceover,
                };
              }),
            };
          })
        );
      }
    };
    const handlePointerUp = () => {
      setDragState(null);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragState, timelineMaxSec]);

  // Smooth touch & pointer dragging for Timeline Playhead Cursor & Ruler
  const updatePlayheadFromClientX = (clientX: number) => {
    const el = playheadRulerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    const nextSec = Number((pct * Math.max(1, timelineMaxSec)).toFixed(1));
    setPlayhead(nextSec);
    if (editorVideoRef.current && Number.isFinite(editorVideoRef.current.duration)) {
      editorVideoRef.current.currentTime = Math.min(editorVideoRef.current.duration, nextSec);
    }
  };

  useEffect(() => {
    if (!scrubbingPlayhead) return;
    const onMove = (ev: PointerEvent) => {
      updatePlayheadFromClientX(ev.clientX);
    };
    const onUp = () => setScrubbingPlayhead(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [scrubbingPlayhead, timelineMaxSec]);

  useEffect(() => {
    if (editorVideoRef.current) {
      editorVideoRef.current.playbackRate = clipSpeed;
    }
  }, [clipSpeed, stage, mediaUrl]);

  if (!isOpen) return null;

  const activeCameraEffect = CAMERA_EFFECTS_60[liveEffectIdx] ?? CAMERA_EFFECTS_60[0];
  const leftEffects = CAMERA_EFFECTS_60.slice(0, 32);
  const rightEffects = CAMERA_EFFECTS_60.slice(32);

  const selectedPostFilter =
    POST_FILTERS_80.find((f) => f.id === selectedPostFilterId) ?? POST_FILTERS_80[0];

  const computedEditorFilter = buildVideoCssFilter(
    selectedPostFilter.cssFilter,
    lumetri,
    faceMaskEnabled ? postRetouch.skinSmooth * 0.6 : postRetouch.skinSmooth
  );

  const activeClip = clips.find((c) => c.id === selectedClipId) ?? clips[0];
  const outputDurationSec = calculateClipsTotalDuration(clips);

  const captureSnapshot = (): EditorSnapshot => ({
    clips: clips.map((c) => ({ ...c })),
    lumetri: { ...lumetri, hsl: { ...lumetri.hsl } },
    selectedPostFilterId,
    overlayTracks: overlayTracks.map((o) => ({ ...o })),
    textCaption,
    textStyle,
    textVisible,
    removeBgEnabled,
    chromaKey: { ...chromaKey },
    volumeLevel,
    volumeDucking,
    fadeInSec,
    fadeOutSec,
    beatMarkers: [...beatMarkers],
    clipSpeed,
  });

  const applySnapshot = (snap: EditorSnapshot) => {
    setClips(snap.clips);
    setSelectedClipId(snap.clips[0]?.id || 'clip-1');
    setLumetri(snap.lumetri);
    setSelectedPostFilterId(snap.selectedPostFilterId);
    setOverlayTracks(snap.overlayTracks);
    setTextCaption(snap.textCaption);
    setTextStyle(snap.textStyle as 'Neon Glow' | 'Minimal Bold' | 'Subtitle Box');
    setTextVisible(snap.textVisible);
    setRemoveBgEnabled(snap.removeBgEnabled);
    setChromaKey(snap.chromaKey);
    setVolumeLevel(snap.volumeLevel);
    setVolumeDucking(snap.volumeDucking);
    setFadeInSec(snap.fadeInSec);
    setFadeOutSec(snap.fadeOutSec);
    setBeatMarkers(snap.beatMarkers);
    setClipSpeed(snap.clipSpeed ?? 1);
  };

  const pushHistory = () => {
    setHistoryPast((prev) => [...prev.slice(-19), captureSnapshot()]);
    setHistoryFuture([]);
  };

  const handleUndo = () => {
    if (historyPast.length === 0) {
      onNotify('Nothing left to undo');
      return;
    }
    const prevSnap = historyPast[historyPast.length - 1];
    const currentSnap = captureSnapshot();
    setHistoryPast((prev) => prev.slice(0, -1));
    setHistoryFuture((fut) => [currentSnap, ...fut.slice(0, 19)]);
    applySnapshot(prevSnap);
    onNotify('Undid last edit');
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) {
      onNotify('Nothing left to redo');
      return;
    }
    const nextSnap = historyFuture[0];
    const currentSnap = captureSnapshot();
    setHistoryFuture((fut) => fut.slice(1));
    setHistoryPast((prev) => [...prev.slice(-19), currentSnap]);
    applySnapshot(nextSnap);
    onNotify('Redid edit');
  };

  const handleStartShutter = () => {
    if (isRecording) {
      setIsRecording(false);
      setStage('editor');
      return;
    }
    setRecordElapsed(0);
    if (timerSec > 0) {
      setCountdownActive(timerSec);
    } else {
      setIsRecording(true);
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    pushHistory();
    setMediaUrl(previewUrl);
    latestMediaUrlRef.current = previewUrl;
    setMediaMime(file.type || (isVideo ? 'video/mp4' : 'image/jpeg'));
    latestMediaMimeRef.current = file.type || (isVideo ? 'video/mp4' : 'image/jpeg');
    if (!isVideo) {
      setThumbnailUrl(previewUrl);
      latestThumbUrlRef.current = previewUrl;
    }
    setMediaType(isVideo ? 'video' : 'image');
    if (isVideo) {
      setSelectedOption('video');
      setClips([{ id: 'clip-1', label: file.name.slice(0, 18), start: 0, end: 45 }]);
      setSelectedClipId('clip-1');
      setPlayhead(10);
    }
    setStage('editor');
    onNotify(`Loaded ${file.name} into NepTok CapCut-Style Studio`);
    trackUploadPromise(
      uploadMediaFile(file, isVideo ? 'video' : 'image', file.name)
        .then((uploaded) => {
          setMediaUrl(uploaded.url);
          latestMediaUrlRef.current = uploaded.url;
          setMediaMime(uploaded.contentType);
          latestMediaMimeRef.current = uploaded.contentType;
          setR2Key(uploaded.key);
          latestR2KeyRef.current = uploaded.key;
          if (!isVideo) {
            setThumbnailUrl(uploaded.url);
            latestThumbUrlRef.current = uploaded.url;
          }
        })
        .catch(() => {})
    );
  };

  const handleOverlayFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const overlayId = `ov-track-${Date.now()}`;
    pushHistory();
    setOverlayTracks((prev) => {
      const nextNum = prev.length + 1;
      return [
        ...prev,
        {
          id: overlayId,
          label: `Overlay ${nextNum}`,
          title: file.name.slice(0, 22),
          previewUrl,
          visible: true,
          muted: false,
        },
      ];
    });
    trackUploadPromise(
      uploadMediaFile(file, file.type.startsWith('video/') ? 'video' : 'image', file.name)
        .then((uploaded) => {
          setOverlayTracks((prev) =>
            prev.map((ov) => (ov.id === overlayId ? { ...ov, previewUrl: uploaded.url } : ov))
          );
        })
        .catch(() => {})
    );
    onNotify(`Added Overlay ${overlayTracks.length + 1}: ${file.name}`);
    e.target.value = '';
  };

  const handleAddPresetOverlay = (title: string, url: string) => {
    pushHistory();
    const hasEmptyFirst = overlayTracks.length === 1 && !overlayTracks[0].visible;
    if (hasEmptyFirst) {
      setOverlayTracks([{ ...overlayTracks[0], title, previewUrl: url, visible: true }]);
      onNotify(`Enabled Overlay 1: ${title}`);
    } else {
      const nextNum = overlayTracks.length + 1;
      setOverlayTracks((prev) => [
        ...prev,
        {
          id: `ov-track-${Date.now()}`,
          label: `Overlay ${nextNum}`,
          title,
          previewUrl: url,
          visible: true,
          muted: false,
        },
      ]);
      onNotify(`Generated Overlay ${nextNum}: ${title}`);
    }
    setActiveBottomTool('none');
  };

  const handleThumbnailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setThumbnailUrl(previewUrl);
    latestThumbUrlRef.current = previewUrl;
    trackUploadPromise(
      uploadMediaFile(file, 'thumbnail', file.name)
        .then((uploaded) => {
          setThumbnailUrl(uploaded.url);
          latestThumbUrlRef.current = uploaded.url;
        })
        .catch(() => {})
    );
    onNotify(`Updated cover thumbnail: ${file.name}`);
    e.target.value = '';
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const trackIdx = targetAudioTrackIdx;
    const startSec = Number(Math.min(playhead, Math.max(0, timelineMaxSec - 4)).toFixed(1));
    const endSec = Number(Math.min(timelineMaxSec, startSec + Math.max(10, Math.round(outputDurationSec * 0.7))).toFixed(1));
    const newSegId = `a${trackIdx + 1}-seg-${Date.now()}`;
    setAudioTracks((prev) =>
      prev.map((trk, idx) =>
        idx === trackIdx
          ? {
              ...trk,
              visible: true,
              segments: [
                ...trk.segments,
                {
                  id: newSegId,
                  label: file.name,
                  start: startSec,
                  end: endSec,
                  url,
                  muted: false,
                },
              ],
            }
          : trk
      )
    );
    trackUploadPromise(
      uploadMediaFile(file, 'audio', file.name)
        .then((uploaded) => {
          setAudioTracks((prev) =>
            prev.map((trk, idx) =>
              idx === trackIdx
                ? {
                    ...trk,
                    segments: trk.segments.map((s) =>
                      s.id === newSegId ? { ...s, url: uploaded.url } : s
                    ),
                  }
                : trk
            )
          );
        })
        .catch(() => {})
    );
    setActiveTrackKind('audio');
    setSelectedAudioTarget({ trackIdx, clipId: newSegId });
    setLibraryPickerTrackIdx(null);
    onNotify(`Added "${file.name}" to Audio ${trackIdx + 1}`);
    e.target.value = '';
  };

  const handleToggleVoiceoverRecording = async (trackIdx: 0 | 1) => {
    setVoiceoverError(null);
    if (recordingTrackIdx !== null) {
      mediaRecorderRef.current?.stop();
      voiceStreamRef.current?.getTracks().forEach((t) => t.stop());
      voiceStreamRef.current = null;
      setRecordingTrackIdx(null);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceoverError('Live microphone recording is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];
      voiceElapsedRef.current = 0;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) voiceChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const dur = Math.max(2, voiceElapsedRef.current);
        const startSec = Number(Math.min(playhead, Math.max(0, timelineMaxSec - 2)).toFixed(1));
        const endSec = Number(Math.min(timelineMaxSec, startSec + dur).toFixed(1));
        const newSegId = `a${trackIdx + 1}-vo-${Date.now()}`;
        setAudioTracks((prev) =>
          prev.map((trk, idx) =>
            idx === trackIdx
              ? {
                  ...trk,
                  visible: true,
                  segments: [
                    ...trk.segments,
                    {
                      id: newSegId,
                      label: `Voiceover (${dur}s)`,
                      start: startSec,
                      end: endSec,
                      url,
                      muted: false,
                      isVoiceover: true,
                    },
                  ],
                }
              : trk
          )
        );
        trackUploadPromise(
          uploadMediaFile(blob, 'audio', `voiceover-${Date.now()}.webm`)
            .then((uploaded) => {
              setAudioTracks((prev) =>
                prev.map((trk, idx) =>
                  idx === trackIdx
                    ? {
                        ...trk,
                        segments: trk.segments.map((s) =>
                          s.id === newSegId ? { ...s, url: uploaded.url } : s
                        ),
                      }
                    : trk
                )
              );
            })
            .catch(() => {})
        );
        setActiveTrackKind('audio');
        setSelectedAudioTarget({ trackIdx, clipId: newSegId });
        onNotify(`Saved live voiceover to Audio ${trackIdx + 1}`);
      };
      mediaRecorderRef.current = recorder;
      setVoiceoverElapsed(0);
      recorder.start();
      setRecordingTrackIdx(trackIdx);
    } catch {
      setVoiceoverError(
        'Microphone access unavailable or denied. Allow mic permission to record live voiceover.'
      );
    }
  };

  const selectedAudioSegment =
    selectedAudioTarget
      ? audioTracks[selectedAudioTarget.trackIdx]?.segments.find(
          (s) => s.id === selectedAudioTarget.clipId
        ) ?? null
      : null;

  const handleSplitAtPlayhead = () => {
    if (activeTrackKind === 'audio' && selectedAudioTarget && selectedAudioSegment) {
      const trkIdx = selectedAudioTarget.trackIdx;
      const trk = audioTracks[trkIdx];
      const splitResult = splitTimelineClipAtTime(
        trk.segments,
        selectedAudioSegment.id,
        playhead
      );
      if (splitResult.length === trk.segments.length) {
        onNotify(
          `Move Playhead inside "${selectedAudioSegment.label}" (${selectedAudioSegment.start}s–${selectedAudioSegment.end}s) to split`
        );
        return;
      }
      const nextSegs: AudioClipSegment[] = splitResult.map((seg) => ({
        ...seg,
        url: selectedAudioSegment.url,
        muted: selectedAudioSegment.muted,
        isVoiceover: selectedAudioSegment.isVoiceover,
      }));
      setAudioTracks((prev) =>
        prev.map((item, i) => (i === trkIdx ? { ...item, segments: nextSegs } : item))
      );
      setSelectedAudioTarget({ trackIdx: trkIdx, clipId: nextSegs[0].id });
      onNotify(`Split Audio "${selectedAudioSegment.label}" at ${playhead.toFixed(1)}s`);
      return;
    }

    if (!activeClip) return;
    const next = splitTimelineClipAtTime(clips, activeClip.id, playhead);
    if (next.length === clips.length) {
      onNotify(
        `Move Playhead inside "${activeClip.label}" (${activeClip.start}s–${activeClip.end}s) to split`
      );
      return;
    }
    pushHistory();
    setClips(next);
    setSelectedClipId(next[0].id);
    onNotify(`Split "${activeClip.label}" at ${playhead.toFixed(1)}s`);
  };

  const handleQuickTrimOrExtend = (edge: 'start' | 'end', deltaSec: number) => {
    if (activeTrackKind === 'audio' && selectedAudioTarget && selectedAudioSegment) {
      const trkIdx = selectedAudioTarget.trackIdx;
      setAudioTracks((prev) =>
        prev.map((trk, i) => {
          if (i !== trkIdx) return trk;
          const next = trimOrExtendTimelineClip(
            trk.segments,
            selectedAudioSegment.id,
            edge,
            deltaSec,
            1,
            180
          );
          const maxEnd = next.reduce((m, s) => Math.max(m, s.end), timelineMaxSec);
          if (maxEnd > timelineMaxSec) setTimelineMaxSec(Math.min(180, Math.ceil(maxEnd)));
          return {
            ...trk,
            segments: next.map((n) => {
              const orig = trk.segments.find((o) => o.id === n.id);
              return { ...n, url: orig?.url, muted: orig?.muted ?? false, isVoiceover: orig?.isVoiceover };
            }),
          };
        })
      );
      return;
    }
    if (!activeClip) return;
    pushHistory();
    const next = trimOrExtendTimelineClip(clips, activeClip.id, edge, deltaSec, 1, 180);
    const maxEnd = next.reduce((m, c) => Math.max(m, c.end), timelineMaxSec);
    if (maxEnd > timelineMaxSec) setTimelineMaxSec(Math.min(180, Math.ceil(maxEnd)));
    setClips(next);
  };

  const handleQuickMoveSelected = (deltaSec: number) => {
    if (activeTrackKind === 'audio' && selectedAudioTarget && selectedAudioSegment) {
      const trkIdx = selectedAudioTarget.trackIdx;
      setAudioTracks((prev) =>
        prev.map((trk, i) => {
          if (i !== trkIdx) return trk;
          const next = moveTimelineClip(trk.segments, selectedAudioSegment.id, deltaSec, 180);
          const maxEnd = next.reduce((m, s) => Math.max(m, s.end), timelineMaxSec);
          if (maxEnd > timelineMaxSec) setTimelineMaxSec(Math.min(180, Math.ceil(maxEnd)));
          return {
            ...trk,
            segments: next.map((n) => {
              const orig = trk.segments.find((o) => o.id === n.id);
              return { ...n, url: orig?.url, muted: orig?.muted ?? false, isVoiceover: orig?.isVoiceover };
            }),
          };
        })
      );
      return;
    }
    if (!activeClip) return;
    pushHistory();
    const next = moveTimelineClip(clips, activeClip.id, deltaSec, 180);
    const maxEnd = next.reduce((m, c) => Math.max(m, c.end), timelineMaxSec);
    if (maxEnd > timelineMaxSec) setTimelineMaxSec(Math.min(180, Math.ceil(maxEnd)));
    setClips(next);
  };

  const handleUpdateClipBound = (field: 'start' | 'end', value: number) => {
    if (!activeClip) return;
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== activeClip.id) return c;
        if (field === 'start') {
          return { ...c, start: Math.min(value, c.end - 1) };
        }
        return { ...c, end: Math.max(value, c.start + 1) };
      })
    );
  };

  const handleDeleteSelectedClip = () => {
    if (clips.length <= 1 || !activeClip) {
      onNotify('Keep at least 1 video clip on Track V1');
      return;
    }
    pushHistory();
    const remaining = clips.filter((c) => c.id !== activeClip.id);
    setClips(remaining);
    setSelectedClipId(remaining[0].id);
    onNotify(`Removed clip "${activeClip.label}"`);
  };

  const handleAddMoreClip = () => {
    pushHistory();
    const lastEnd = clips[clips.length - 1]?.end ?? 0;
    const newStart = Number(lastEnd.toFixed(1));
    const newEnd = Number((lastEnd + 12).toFixed(1));
    const nextClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      label: `Clip ${clips.length + 1}`,
      start: newStart,
      end: newEnd,
    };
    setClips((prev) => [...prev, nextClip]);
    setTimelineMaxSec((m) => Math.max(m, newEnd));
    setSelectedClipId(nextClip.id);
    onNotify(`Added ${nextClip.label} (${newStart}s–${newEnd}s) to Video Track`);
  };

  const handleDuplicateSelectedClip = () => {
    if (!activeClip) return;
    pushHistory();
    const next = duplicateTimelineClip(clips, activeClip.id);
    setClips(next);
    const added = next[next.length - 1];
    if (added) {
      setTimelineMaxSec((m) => Math.max(m, added.end));
      setSelectedClipId(added.id);
    }
    onNotify(`Duplicated "${activeClip.label}" on Video Track`);
  };

  const handleSlipSelectedClip = (deltaSec: number) => {
    if (!activeClip) return;
    pushHistory();
    const next = slipTimelineClip(clips, activeClip.id, deltaSec, timelineMaxSec);
    setClips(next);
    onNotify(`Slipped "${activeClip.label}" ${deltaSec > 0 ? `+${deltaSec}s` : `${deltaSec}s`}`);
  };

  const handleGenerateAiVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiVideoPrompt.trim() || aiVideoLoading) return;
    setAiVideoError(null);
    setAiVideoLoading(true);
    try {
      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiVideoPrompt.trim(),
          aspectRatio: aiVideoAspect,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiVideoError(data.error || 'AI video generation failed.');
      } else if (data.videoDataUrl) {
        setMediaUrl(data.videoDataUrl);
        latestMediaUrlRef.current = data.videoDataUrl;
        setMediaMime('video/mp4');
        latestMediaMimeRef.current = 'video/mp4';
        setMediaType('video');
        setAspectRatio(aiVideoAspect);
        setSelectedOption('video');
        setClips([{ id: 'clip-ai-1', label: 'AI Generated Clip', start: 0, end: 5 }]);
        setTimelineMaxSec(15);
        setSelectedClipId('clip-ai-1');
        setPlayhead(2);
        onNotify('Generated AI video loaded onto Timeline Track V1!');
      }
    } catch {
      setAiVideoError('Network error contacting NepTok AI Video Generator.');
    } finally {
      setAiVideoLoading(false);
    }
  };

  const handlePublish = async (asDraft = false) => {
    if (pendingUploadsRef.current.size > 0) {
      onNotify('Finalizing media upload to Cloudflare R2...');
      await Promise.all(Array.from(pendingUploadsRef.current)).catch(() => {});
    }

    const resolvedMediaUrl = latestMediaUrlRef.current || mediaUrl;
    const resolvedThumbnailUrl = latestThumbUrlRef.current || thumbnailUrl;
    const resolvedMediaMime = latestMediaMimeRef.current || mediaMime;
    const resolvedR2Key = latestR2KeyRef.current || r2Key;

    const primaryAudioClip =
      audioTracks
        .filter((t) => t.visible && !t.muted)
        .flatMap((t) => t.segments)
        .find((s) => !s.muted) ?? null;

    const buildPostPayload = (isDraftFlag: boolean): FeedPost => ({
      id: editingPost
        ? editingPost.id
        : isDraftFlag
        ? `draft-${Date.now()}`
        : `post-${Date.now()}`,
      type: selectedOption === 'photo' ? 'photo' : selectedOption === 'reels' ? 'reel' : 'video',
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorVerified: true,
      authorAvatarColor: '#FF0080',
      mediaUrl: resolvedMediaUrl,
      thumbnailUrl: resolvedThumbnailUrl,
      mediaMime: resolvedMediaMime,
      r2Key: resolvedR2Key,
      caption:
        caption ||
        (isDraftFlag ? 'Untitled Draft Project' : 'Created with NepTok Pro Studio (8K + Lumetri HSL)'),
      hashtags: hashtagsList.length ? hashtagsList : ['#NepTok', '#Nepal', '#8KStudio'],
      tags: tagsList,
      sound: primaryAudioClip
        ? {
            id: `snd-${Date.now()}`,
            title: primaryAudioClip.label,
            originalUploaderHandle: currentUser.handle,
            originalUploaderName: currentUser.name,
            usesCount: 1,
            durationSec: Math.max(5, Math.round(outputDurationSec)),
            saved: false,
          }
        : selectedCameraSound ??
          initialSound ?? {
            id: `snd-${Date.now()}`,
            title: `Original Sound - ${currentUser.name}`,
            originalUploaderHandle: currentUser.handle,
            originalUploaderName: currentUser.name,
            usesCount: 1,
            durationSec: Math.max(5, Math.round(outputDurationSec)),
            saved: false,
          },
      likes: editingPost?.likes ?? (isDraftFlag ? 0 : 1),
      likedByMe: editingPost?.likedByMe ?? false,
      comments: editingPost?.comments ?? [],
      reposts: editingPost?.reposts ?? 0,
      repostedByMe: false,
      giftsReceivedCoins: editingPost?.giftsReceivedCoins ?? 0,
      savedByMe: false,
      visibility,
      allowDuet: true,
      allowDownload: true,
      allowComments: true,
      allowSharing: true,
      adSettingsEnabled: true,
      isDraft: isDraftFlag,
      cssFilter: computedEditorFilter,
      views: editingPost?.views ?? (isDraftFlag ? 0 : 12),
      estimatedEarningsUsd: editingPost?.estimatedEarningsUsd ?? 0,
    });

    if (asDraft) {
      const draftPost = buildPostPayload(true);
      if (onSaveDraft) {
        onSaveDraft(draftPost);
      }
      onNotify('Saved project to Drafts');
      onClose();
      return;
    }

    setSafetyScanState({ scanning: true });
    try {
      const scanRes = await fetch('/api/moderation/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption || 'NepTok Himalayan Studio Upload',
          audioTitle: primaryAudioClip?.label || initialSound?.title || 'Original Sound',
          mediaType: selectedOption || 'video',
          creator: `@${currentUser.handle}`,
        }),
      });
      const verdict = await scanRes.json();
      if (verdict.status === 'BLOCKED') {
        setSafetyScanState({
          scanning: false,
          blocked: true,
          verdict: verdict.reasons?.[0] || 'Blocked by AI Censorship & Safety Engine',
        });
        return;
      }

      if (selectedOption === 'story') {
        onPublishStory({
          id: `st-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.name.split(' ')[0],
          authorHandle: currentUser.handle,
          mediaUrl: resolvedMediaUrl,
          caption: caption || 'NepTok 48-Hour Story',
          templateName: storyTemplate,
          createdAtMs: Date.now(),
          online: true,
        });
        onNotify('Story published (active for 48 hours)');
        onClose();
        return;
      }

      const newPost = buildPostPayload(false);

      onPublishPost(newPost);
      onNotify(
        verdict.status === 'FLAGGED'
          ? 'Published with copyrighted audio muted automatically by AI Scan'
          : 'Cleared by AI Censorship & Copyright Scan — Published!'
      );
      onClose();
    } catch {
      setSafetyScanState({ scanning: false, blocked: false });
      onNotify('Could not complete AI safety scan');
    }
  };

  const creatorSoundChoices: OriginalSound[] =
    communitySounds.length > 0
      ? communitySounds
      : LIBRARY_AUDIO_TRACKS.map((l) => ({
          id: l.id,
          title: l.title,
          originalUploaderHandle: 'neptok_studio',
          originalUploaderName: 'NepTok Studio',
          usesCount: 1200,
          durationSec: l.durationSec,
          saved: false,
        }));

  return (
    <div className="fixed inset-0 z-50 bg-[#090514] text-white flex flex-col overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleUploadFile}
        className="hidden"
      />
      <input
        ref={overlayFileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleOverlayFileUpload}
        className="hidden"
      />
      <input
        ref={thumbnailFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleThumbnailFileUpload}
        className="hidden"
      />
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />

      {/* Top Studio Header */}
      <div className="px-3 sm:px-4 py-3 bg-[#120824] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label="Close Create Studio"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-sm sm:text-base truncate">
              {stage === 'selector'
                ? 'Create on NepTok'
                : stage === 'camera'
                ? `Pro Camera · ${selectedOption?.toUpperCase() || 'VIDEO'}`
                : stage === 'publish'
                ? 'Post & Publish'
                : selectedOption === 'story'
                ? 'Story Creator (48-Hour Duration)'
                : selectedOption === 'photo'
                ? 'Photo Studio'
                : 'NepTok Post-Production Studio'}
            </h2>
            {(selectedCameraSound || initialSound) && (
              <p className="text-[11px] text-pink-300 truncate">
                Using sound: {(selectedCameraSound || initialSound)?.title} (@
                {(selectedCameraSound || initialSound)?.originalUploaderHandle})
              </p>
            )}
          </div>
        </div>

        {stage !== 'selector' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setStage(stage === 'camera' ? 'editor' : stage === 'publish' ? 'editor' : 'camera')
              }
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
            >
              {stage === 'camera' ? (
                <span>Open Editor →</span>
              ) : stage === 'publish' ? (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Editor</span>
                </>
              ) : (
                <span>← Camera</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* STAGE 1: Mandatory 4-Option Selector */}
      {stage === 'selector' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-xl w-full space-y-6">
            <div className="text-center space-y-1.5">
              <h3 className="font-display text-2xl font-extrabold">What do you want to create?</h3>
              <p className="text-xs text-purple-200/75">
                Choose a format to launch NepTok&apos;s Pro Camera (60+ live effects) or Raw Post-Production Suite.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {[
                {
                  id: 'video' as const,
                  title: 'Video',
                  desc: 'Pro Camera + Full Timeline, Lumetri HSL & AI Face Mask',
                  icon: Video,
                  gradient: 'from-[#FF0080] to-[#9D00FF]',
                  nextStage: 'camera' as const,
                },
                {
                  id: 'reels' as const,
                  title: 'Reels',
                  desc: 'Vertical 15s/60s Short-Form Camera & 80+ AR Filters',
                  icon: Film,
                  gradient: 'from-[#9D00FF] to-[#3B82F6]',
                  nextStage: 'camera' as const,
                },
                {
                  id: 'photo' as const,
                  title: 'Photo',
                  desc: 'Dedicated Photo Camera & Pro Skin/HSL Color Editor',
                  icon: ImageIcon,
                  gradient: 'from-[#EC4899] to-[#F59E0B]',
                  nextStage: 'editor' as const,
                },
                {
                  id: 'story' as const,
                  title: 'Story (48 Hours)',
                  desc: 'Fast Story Templates, Stickers & Text · Active 48 Hours',
                  icon: Clock,
                  gradient: 'from-[#06B6D4] to-[#9D00FF]',
                  nextStage: 'editor' as const,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedOption(opt.id);
                      setStage(opt.nextStage);
                    }}
                    className="group text-left p-5 rounded-3xl bg-[#140A26] border border-white/12 hover:border-[#FF0080] transition-all flex flex-col gap-3 cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-base text-white">{opt.title}</p>
                      <p className="text-xs text-purple-200/75 mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: Pro In-Camera Recording Interface */}
      {stage === 'camera' && (
        <div className="relative flex-1 flex flex-col overflow-hidden bg-black">
          {/* Live Camera Viewport (Webcam or Studio Simulation) */}
          <div className="relative flex-1 overflow-hidden flex items-center justify-center">
            {hasLiveWebcam ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                data-facing={facingFront ? 'front' : 'back'}
                className="w-full h-full object-cover transition-transform duration-200"
                style={{
                  filter: `${activeCameraEffect.cssFilter} brightness(${
                    1 + camRetouch.contrastGlow * 0.002
                  }) contrast(${1 + camRetouch.contrastGlow * 0.002})`,
                  transform: facingFront ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Pro Camera Live Preview"
                referrerPolicy="no-referrer"
                data-facing={facingFront ? 'front' : 'back'}
                className="w-full h-full object-cover transition-transform duration-200"
                style={{
                  filter: `${activeCameraEffect.cssFilter} brightness(${
                    1 + camRetouch.contrastGlow * 0.002
                  }) contrast(${1 + camRetouch.contrastGlow * 0.002})`,
                  transform: facingFront ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              />
            )}

            {activeCameraEffect.overlayTint && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: activeCameraEffect.overlayTint }}
              />
            )}

            {/* Top Status & Sounds Selector Pill + Camera Flip Button */}
            <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold text-purple-100 shrink-0">
                  {facingFront ? 'Front Cam' : 'Back Cam'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCameraSoundPicker((s) => !s)}
                  className="px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-1.5 truncate max-w-[200px] cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5 text-[#FF0080] shrink-0" />
                  <span className="truncate">
                    {selectedCameraSound ? selectedCameraSound.title : 'Add Creator Sound'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                aria-label="Flip Camera"
                onClick={() => {
                  setFacingFront((f) => {
                    const next = !f;
                    onNotify(next ? 'Switched to Front Camera' : 'Switched to Back Camera');
                    return next;
                  });
                }}
                className="px-2.5 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1.5 text-[11px] font-bold cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip</span>
              </button>
            </div>

            {/* Right-Side Vertical Stack of Effect & Retouch Icons (Glow through Skin Retouch) */}
            <div
              data-testid="camera-right-icon-stack"
              className="absolute right-2.5 top-16 z-20 flex flex-col items-center gap-2.5 bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 px-1.5"
            >
              <button
                type="button"
                aria-label="Glow Boost"
                onClick={() => {
                  setCamRetouch((prev) => ({
                    ...prev,
                    contrastGlow: prev.contrastGlow >= 60 ? 25 : 70,
                  }));
                  onNotify('Toggled Live Glow intensity');
                }}
                className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white cursor-pointer"
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                    camRetouch.contrastGlow >= 60
                      ? 'bg-[#FF0080]/30 border-[#FF0080]'
                      : 'bg-white/10 border-white/15'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-pink-300" />
                </span>
                <span>Glow</span>
              </button>

              <button
                type="button"
                aria-label="Skin Retouch"
                onClick={() => setShowCameraRetouch((s) => !s)}
                className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white cursor-pointer"
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                    showCameraRetouch
                      ? 'bg-[#FF0080] border-white'
                      : 'bg-white/10 border-white/15'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                </span>
                <span>Retouch</span>
              </button>

              <button
                type="button"
                aria-label="Cycle Camera Effects"
                onClick={() => setLiveEffectIdx((idx) => (idx + 1) % CAMERA_EFFECTS_60.length)}
                className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white cursor-pointer"
              >
                <span className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-purple-200" />
                </span>
                <span>Effects</span>
              </button>

              <button
                type="button"
                aria-label="Countdown Timer"
                onClick={() => setTimerSec((t) => (t === 0 ? 3 : t === 3 ? 10 : 0))}
                className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white cursor-pointer"
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                    timerSec > 0 ? 'bg-[#9D00FF]/40 border-[#9D00FF]' : 'bg-white/10 border-white/15'
                  }`}
                >
                  <Timer className="w-4 h-4 text-[#FF0080]" />
                </span>
                <span>{timerSec === 0 ? 'Timer' : `${timerSec}s`}</span>
              </button>

              <button
                type="button"
                aria-label="Camera Flash"
                onClick={() =>
                  setFlashMode((f) => (f === 'Off' ? 'On' : f === 'On' ? 'Auto' : 'Off'))
                }
                className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white cursor-pointer"
              >
                <span className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-300" />
                </span>
                <span>{flashMode}</span>
              </button>

              <button
                type="button"
                aria-label="Creator Sounds"
                onClick={() => setShowCameraSoundPicker((s) => !s)}
                className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white cursor-pointer"
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                    showCameraSoundPicker || selectedCameraSound
                      ? 'bg-emerald-500/30 border-emerald-400'
                      : 'bg-white/10 border-white/15'
                  }`}
                >
                  <Music className="w-4 h-4 text-emerald-300" />
                </span>
                <span>Sounds</span>
              </button>
            </div>

            {/* Creator Uploaded Songs / Audio Picker Drawer */}
            {showCameraSoundPicker && (
              <div
                data-testid="camera-sound-picker"
                className="absolute left-3 right-16 top-16 z-30 rounded-2xl bg-[#140A26]/95 backdrop-blur-xl border border-white/15 p-3 space-y-2 shadow-2xl max-h-60 overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#FF0080]" />
                    <span>Songs Uploaded by Creators</span>
                  </p>
                  <button
                    type="button"
                    aria-label="Close Sound Picker"
                    onClick={() => setShowCameraSoundPicker(false)}
                    className="text-purple-200 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {creatorSoundChoices.map((snd) => {
                    const active = selectedCameraSound?.id === snd.id;
                    return (
                      <button
                        key={snd.id}
                        type="button"
                        onClick={() => {
                          setSelectedCameraSound(snd);
                          setAudioTracks((prev) =>
                            prev.map((trk, i) =>
                              i === 0
                                ? {
                                    ...trk,
                                    visible: true,
                                    segments: [
                                      {
                                        id: `a1-cam-${Date.now()}`,
                                        label: snd.title,
                                        start: 0,
                                        end: Math.min(timelineMaxSec, snd.durationSec),
                                        muted: false,
                                      },
                                    ],
                                  }
                                : trk
                            )
                          );
                          setShowCameraSoundPicker(false);
                          onNotify(`Playing creator song: ${snd.title} (@${snd.originalUploaderHandle})`);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer ${
                          active
                            ? 'bg-[#FF0080]/25 border-[#FF0080] text-white'
                            : 'bg-[#1D0F38] border-white/10 text-purple-100 hover:border-white/30'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{snd.title}</p>
                          <p className="text-[10px] text-purple-300/80 truncate">
                            @{snd.originalUploaderHandle} · {snd.durationSec}s
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-pink-300 shrink-0">
                          {active ? 'Selected' : 'Use'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recording Progress Bar */}
            {isRecording && (
              <div className="absolute top-14 inset-x-4 z-20 space-y-1">
                <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full bg-[#FF0080] transition-all duration-300"
                    style={{ width: `${(recordElapsed / durationLimit) * 100}%` }}
                  />
                </div>
                <p className="text-center font-mono text-xs font-bold text-rose-400 tabular-nums">
                  REC 0:{recordElapsed.toString().padStart(2, '0')} / 0:{durationLimit} · {speed}x
                </p>
              </div>
            )}

            {/* Countdown Ring Overlay */}
            {countdownActive !== null && (
              <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-4 border-[#FF0080] flex items-center justify-center font-display text-5xl font-extrabold text-white animate-pulse">
                  {countdownActive}
                </div>
              </div>
            )}

            {/* In-Camera Advanced Retouch Panel (Eyes, Under-Eye & Underarm/Body Smoothing, Contrast & Glow, De-Noise) */}
            {showCameraRetouch && (
              <div className="absolute left-3 right-16 bottom-44 z-30 rounded-2xl bg-[#140A26]/95 backdrop-blur-xl border border-[#FF0080]/40 p-4 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">In-Camera Live Skin &amp; Retouch Suite</p>
                  <button
                    type="button"
                    aria-label="Close Retouch Panel"
                    onClick={() => setShowCameraRetouch(false)}
                    className="text-purple-200 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {[
                  { key: 'eyes' as const, label: 'Eyes Enhancement (Brighten & Size)' },
                  { key: 'underEyeAndBody' as const, label: 'Skin Retouch & Smoothing' },
                  { key: 'contrastGlow' as const, label: 'Live Contrast & Glow' },
                  { key: 'deNoise' as const, label: 'Noise Reduction (De-Noise)' },
                ].map((slider) => (
                  <div key={slider.key} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-purple-100">{slider.label}</span>
                      <span className="font-mono text-[#FF0080] tabular-nums">
                        {camRetouch[slider.key]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={camRetouch[slider.key]}
                      onChange={(e) =>
                        setCamRetouch({ ...camRetouch, [slider.key]: Number(e.target.value) })
                      }
                      className="w-full accent-[#FF0080]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Controls: Active FX Badge, Speed (0.3x-3x), Duration (15s/60s), Left & Right 60+ Effects Carousels flanking Shutter */}
            <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent pt-6 pb-4 px-3 space-y-2.5">
              {/* Active Live Effect Badge */}
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[11px] font-semibold">
                  {activeCameraEffect.badge} · {activeCameraEffect.name} ({CAMERA_EFFECTS_60.length} Live FX)
                </span>
              </div>

              {/* Speed Selector */}
              <div className="flex items-center justify-center gap-1.5">
                {([0.3, 0.5, 1, 2, 3] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpeed(sp)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer ${
                      speed === sp
                        ? 'bg-[#FF0080] text-white'
                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                    }`}
                  >
                    {sp}x{sp === 0.3 ? ' Slow' : sp === 3 ? ' Fast' : ''}
                  </button>
                ))}
              </div>

              {/* 15s / 60s Toggle Pills */}
              <div className="flex items-center justify-center gap-2">
                {([15, 60] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationLimit(sec)}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      durationLimit === sec
                        ? 'bg-white text-[#090514]'
                        : 'bg-white/10 text-white/75'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Shutter Row flanked LEFT & RIGHT by 60+ Real-Time Effects */}
              <div className="flex items-center justify-between gap-2">
                {/* Left Effects Carousel */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {leftEffects.map((fx) => {
                    const idx = CAMERA_EFFECTS_60.findIndex((c) => c.id === fx.id);
                    const active = idx === liveEffectIdx;
                    return (
                      <button
                        key={fx.id}
                        type="button"
                        onClick={() => setLiveEffectIdx(idx)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer ${
                          active
                            ? 'bg-[#FF0080]/30 border-[#FF0080] text-white'
                            : 'bg-white/10 border-white/10 text-purple-100'
                        }`}
                      >
                        {fx.name}
                      </button>
                    );
                  })}
                </div>

                {/* Central Shutter Button */}
                <button
                  type="button"
                  aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                  onClick={handleStartShutter}
                  className="shrink-0 w-16 h-16 rounded-full border-4 border-white p-1 flex items-center justify-center cursor-pointer"
                >
                  <span
                    className={`transition-all ${
                      isRecording
                        ? 'w-7 h-7 rounded-lg bg-[#FF0080]'
                        : 'w-full h-full rounded-full bg-gradient-to-tr from-[#FF0080] to-[#9D00FF]'
                    }`}
                  />
                </button>

                {/* Right Effects Carousel */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {rightEffects.map((fx) => {
                    const idx = CAMERA_EFFECTS_60.findIndex((c) => c.id === fx.id);
                    const active = idx === liveEffectIdx;
                    return (
                      <button
                        key={fx.id}
                        type="button"
                        onClick={() => setLiveEffectIdx(idx)}
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer ${
                          active
                            ? 'bg-[#9D00FF]/35 border-[#9D00FF] text-white'
                            : 'bg-white/10 border-white/10 text-purple-100'
                        }`}
                      >
                        {fx.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-purple-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#FF0080]" />
                  <span>Upload Raw Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStage('editor')}
                  className="text-xs font-bold text-[#FF0080] cursor-pointer"
                >
                  Proceed to Post-Production →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: Post-Production Studio (Locked Preview + Undo/Redo Playback + Category Bar + Stacked Multi-Track Timeline + Bottom Toolbar + Save Draft / Next >) */}
      {stage === 'editor' && (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* LOCKED TOP/LEFT VIDEO & PHOTO PREVIEW + PLAYBACK/UNDO/REDO + COMPACT CONTROLS */}
          <div
            data-testid="locked-editor-preview"
            className="lg:w-[42%] bg-[#070310] px-3 py-2.5 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 gap-2 shrink-0"
          >
            <div
              className={`relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl ${
                removeBgEnabled
                  ? 'bg-gradient-to-br from-[#1B0E33] via-[#090514] to-[#280D40]'
                  : chromaKey.enabled
                  ? 'bg-slate-900'
                  : 'bg-black'
              } ${
                aspectRatio === '9:16'
                  ? 'w-40 sm:w-52 aspect-[9/16] max-h-[24vh] sm:max-h-[28vh] lg:max-h-[54vh]'
                  : aspectRatio === '1:1'
                  ? 'w-44 sm:w-56 aspect-square max-h-[24vh] sm:max-h-[28vh] lg:max-h-[50vh]'
                  : 'w-full max-w-[300px] sm:max-w-sm aspect-video max-h-[24vh] sm:max-h-[28vh] lg:max-h-[48vh]'
              }`}
            >
              {videoTrackVisible ? (
                mediaType === 'video' ? (
                  <video
                    ref={editorVideoRef}
                    src={mediaUrl}
                    controls
                    playsInline
                    autoPlay={isPlaying}
                    loop
                    muted
                    onLoadedMetadata={(e) => {
                      e.currentTarget.playbackRate = clipSpeed;
                      const dur = Math.round(e.currentTarget.duration || 45);
                      if (dur >= 3 && dur <= 180) {
                        setTimelineMaxSec(dur);
                        setClips([{ id: 'clip-1', label: 'Uploaded Video', start: 0, end: dur }]);
                        setSelectedClipId('clip-1');
                        setPlayhead(Math.min(2, dur));
                      }
                    }}
                    className={`w-full h-full object-cover transition-all duration-150 ${
                      removeBgEnabled ? 'scale-95 rounded-2xl ring-2 ring-[#FF0080]/50' : ''
                    }`}
                    style={{ filter: computedEditorFilter }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Editor Preview"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-all duration-150 ${
                      removeBgEnabled ? 'scale-95 rounded-2xl ring-2 ring-[#FF0080]/50' : ''
                    }`}
                    style={{ filter: computedEditorFilter }}
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-purple-300/70 gap-1">
                  <EyeOff className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Video Track Hidden</span>
                </div>
              )}

              {selectedPostFilter.overlayTint && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: selectedPostFilter.overlayTint }}
                />
              )}

              {/* Active Visible Overlays */}
              {overlayTracks
                .filter((ov) => ov.visible)
                .map((ov, i) => (
                  <div
                    key={ov.id}
                    style={{ bottom: `${10 + i * 24}px`, right: '8px' }}
                    className="absolute z-10 w-12 h-14 rounded-lg overflow-hidden border-2 border-cyan-400 shadow-lg bg-black"
                  >
                    <img
                      src={ov.previewUrl}
                      alt={ov.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}

              {/* Active Text / Caption Overlay */}
              {textVisible && textCaption.trim() && (
                <div className="absolute inset-x-3 bottom-7 z-10 flex justify-center pointer-events-none">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold text-center ${
                      textStyle === 'Neon Glow'
                        ? 'bg-black/45 text-white shadow-[0_0_12px_#FF0080] border border-[#FF0080]/60'
                        : textStyle === 'Minimal Bold'
                        ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide'
                        : 'bg-white text-black'
                    }`}
                  >
                    {textCaption}
                  </span>
                </div>
              )}

              {/* Remove BG / Chroma Key Badges */}
              {(removeBgEnabled || chromaKey.enabled) && (
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end pointer-events-none">
                  {removeBgEnabled && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/85 text-black text-[9px] font-extrabold">
                      BG Cutout
                    </span>
                  )}
                  {chromaKey.enabled && (
                    <span className="px-1.5 py-0.5 rounded bg-green-500/85 text-black text-[9px] font-extrabold">
                      Chroma {chromaKey.intensity}%
                    </span>
                  )}
                </div>
              )}

              {faceMaskEnabled && (activeTool === 'skin' || activeTool === 'retouch') && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-24 h-32 rounded-[50%] border-2 border-dashed border-emerald-400/80 bg-emerald-400/10 flex items-end justify-center pb-1.5">
                    <span className="text-[9px] font-bold text-emerald-300 bg-black/70 px-1.5 py-0.5 rounded">
                      AI Face Mask Locked
                    </span>
                  </div>
                </div>
              )}
              {selectedSticker && (
                <div className="absolute top-4 right-4 text-3xl drop-shadow-lg pointer-events-none">
                  {selectedSticker}
                </div>
              )}
              {selectedEffectOverlay !== 'None' && (
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#FF0080]/80 text-[10px] font-bold">
                  FX: {selectedEffectOverlay}
                </div>
              )}
              {selectedOption === 'story' && (
                <div className="absolute bottom-2.5 inset-x-2.5 p-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-center">
                  {storyTemplate} · Active 48 Hours
                </div>
              )}
            </div>

            {/* Playback Bar with 0:00 / 0:xx + Working Undo / Redo Buttons */}
            {selectedOption !== 'photo' && (
              <div className="w-full max-w-sm flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                  onClick={() => setIsPlaying((p) => !p)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <span className="font-mono text-[10px] tabular-nums text-purple-200 shrink-0">
                  0:{Math.round(playhead).toString().padStart(2, '0')} / 0:{Math.round(outputDurationSec).toString().padStart(2, '0')}
                </span>
                <input
                  type="range"
                  min={0}
                  max={timelineMaxSec}
                  step={0.5}
                  value={playhead}
                  onChange={(e) => setPlayhead(Number(e.target.value))}
                  aria-label="Timeline scrubber"
                  className="flex-1 min-w-0 accent-[#FF0080]"
                />
                <button
                  type="button"
                  aria-label="Undo edit"
                  title="Undo"
                  onClick={handleUndo}
                  disabled={historyPast.length === 0}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Redo edit"
                  title="Redo"
                  onClick={handleRedo}
                  disabled={historyFuture.length === 0}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-35 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Toggle fullscreen preview"
                  onClick={() => onNotify('Fullscreen preview active')}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Compact Top Controls, 9:16 / 1:1 / 1:00 Selector & Immediate Cut / Trim / Move Quick Tools */}
            <div className="w-full max-w-md flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-[#FF0080]" />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('camera')}
                    className="h-7 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  >
                    <Camera className="w-3 h-3 text-[#9D00FF]" />
                    <span>Cam</span>
                  </button>
                </div>

                {/* Aspect Ratios + 1:00 Duration + Quick Cut / Trim / Move Icons Right Beside Them */}
                <div className="flex items-center gap-1 flex-wrap">
                  {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      aria-label={`Aspect Ratio ${ratio}`}
                      onClick={() => setAspectRatio(ratio)}
                      className={`h-7 px-1.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-[#FF0080] border-white text-white'
                          : 'bg-[#140A26] border-white/15 text-purple-200'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                  {selectedOption !== 'photo' && (
                    <button
                      type="button"
                      aria-label="Duration 1:00"
                      onClick={() => {
                        setTimelineMaxSec(60);
                        onNotify('Timeline duration set to 1:00 (60s)');
                      }}
                      className={`h-7 px-1.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                        timelineMaxSec === 60
                          ? 'bg-[#9D00FF] border-white text-white'
                          : 'bg-[#140A26] border-white/15 text-purple-200'
                      }`}
                    >
                      1:00
                    </button>
                  )}

                  {selectedOption !== 'photo' && (
                    <div
                      data-testid="top-quick-tools"
                      className="flex items-center gap-1 pl-1 ml-0.5 border-l border-white/15"
                    >
                      <button
                        type="button"
                        aria-label="Quick Cut Split"
                        title="Cut / Split at Playhead"
                        onClick={handleSplitAtPlayhead}
                        className="h-7 px-2 rounded-lg bg-gradient-to-r from-[#FF0080]/80 to-[#9D00FF]/80 hover:from-[#FF0080] hover:to-[#9D00FF] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Cut</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Quick Clip Speed"
                        title="Playback Speed (0.25x – 3x)"
                        onClick={() =>
                          setQuickToolMode((m) => (m === 'speed' ? 'none' : 'speed'))
                        }
                        className={`h-7 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          quickToolMode === 'speed' || clipSpeed !== 1
                            ? 'bg-amber-400 text-black border-white'
                            : 'bg-[#140A26] border-white/20 text-amber-300 hover:bg-white/10'
                        }`}
                      >
                        <Gauge className="w-3 h-3" />
                        <span>{clipSpeed === 1 ? 'Speed' : `${clipSpeed}x`}</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Quick Move Clip"
                        title="Move Clip Along Timeline"
                        onClick={() =>
                          setQuickToolMode((m) => (m === 'move' ? 'none' : 'move'))
                        }
                        className={`h-7 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          quickToolMode === 'move'
                            ? 'bg-cyan-400 text-black border-white'
                            : 'bg-[#140A26] border-white/20 text-cyan-300 hover:bg-white/10'
                        }`}
                      >
                        <MoveHorizontal className="w-3 h-3" />
                        <span>Move</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Top Quick Speed / Move Drawer (no scrolling needed!) */}
              {selectedOption !== 'photo' && quickToolMode !== 'none' && (
                <div
                  data-testid="top-quick-tool-drawer"
                  className="px-2.5 py-1.5 rounded-xl bg-[#140A26] border border-white/15 flex items-center justify-between gap-2 flex-wrap text-[10px]"
                >
                  <span className="font-bold text-purple-100 truncate">
                    {quickToolMode === 'speed'
                      ? `Speed: ${clipSpeed}x (${activeClip?.label || 'Main Video'})`
                      : activeTrackKind === 'audio' && selectedAudioSegment
                      ? `Audio: ${selectedAudioSegment.label} (${selectedAudioSegment.start}s–${selectedAudioSegment.end}s)`
                      : `Video: ${activeClip?.label || 'Main Video'} (${activeClip?.start ?? 0}s–${activeClip?.end ?? 45}s)`}
                  </span>
                  {quickToolMode === 'speed' ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {PLAYBACK_SPEED_OPTIONS.map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => {
                            pushHistory();
                            const clamped = clampPlaybackSpeed(sp);
                            setClipSpeed(clamped);
                            onNotify(`Playback speed set to ${clamped}x`);
                          }}
                          className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer ${
                            clipSpeed === sp
                              ? 'bg-amber-400 text-black'
                              : 'bg-white/10 text-amber-200 hover:bg-white/20'
                          }`}
                        >
                          {sp}x
                        </button>
                      ))}
                      <input
                        type="range"
                        aria-label="Clip playback speed slider"
                        min={0.25}
                        max={3}
                        step={0.05}
                        value={clipSpeed}
                        onPointerDown={pushHistory}
                        onChange={(e) => setClipSpeed(clampPlaybackSpeed(Number(e.target.value)))}
                        className="w-20 accent-amber-400 ml-1"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleQuickMoveSelected(-2)}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/35 font-bold cursor-pointer"
                      >
                        ← -2s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMoveSelected(-0.5)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
                      >
                        ← -0.5s
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMoveSelected(0.5)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
                      >
                        +0.5s →
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMoveSelected(2)}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/35 font-bold cursor-pointer"
                      >
                        +2s →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT/BOTTOM WORKSPACE: Locked Horizontal Category Bar + Scrollable Tools & Stacked Timeline + Fixed Bottom Action Bar */}
          <div className="flex-1 min-h-0 flex flex-col bg-[#120824] min-w-0 overflow-hidden">
            {/* LOCKED SINGLE-ROW HORIZONTAL CATEGORY BAR */}
            {selectedOption !== 'story' && (
              <div
                data-testid="post-production-tabs"
                className="px-3 py-2 border-b border-white/10 bg-[#0D061C] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap touch-pan-x shrink-0"
              >
                {(
                  [
                    { id: 'adjust', label: 'Adjustment', icon: Sliders },
                    { id: 'lumetri', label: 'Lumetri', icon: Sparkles },
                    { id: 'filters', label: 'Filter', icon: Wand2 },
                    { id: 'skin', label: 'Skin', icon: Eye },
                    { id: 'retouch', label: 'Skin Retouch', icon: Sparkles },
                    { id: 'text', label: 'Text', icon: Type },
                    { id: 'templates', label: 'Templates', icon: Layers },
                    { id: 'effects', label: 'Effects', icon: Zap },
                    { id: 'stickers', label: 'Stickers', icon: Sticker },
                    { id: 'ai-video', label: 'AI Video', icon: Video },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTool(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        activeTool === tab.id
                          ? 'bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-white shadow'
                          : 'bg-white/5 text-purple-200 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* SCROLLABLE EDITOR WORKSPACE: Adjustment/Lumetri + Stacked Multi-Track Timeline */}
            <div
              data-testid="editor-bottom-scroll-workspace"
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            >
              {selectedOption === 'story' ? (
                <div className="p-4 space-y-4">
                  <h4 className="font-display font-bold text-sm">48-Hour Story Templates</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      'Neon Kathmandu Frame',
                      'Himalayan Polaroid',
                      'Golden Dusk Gradient',
                      'Momo & Music Vibes',
                    ].map((tpl) => (
                      <button
                        key={tpl}
                        type="button"
                        onClick={() => setStoryTemplate(tpl)}
                        className={`p-3 rounded-2xl border text-left text-xs font-semibold cursor-pointer ${
                          storyTemplate === tpl
                            ? 'bg-[#FF0080]/20 border-[#FF0080] text-white'
                            : 'bg-[#1B0E33] border-white/10 text-purple-200'
                        }`}
                      >
                        {tpl}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-2">
                      Stickers Library ({POST_STICKERS_120.length} Stickers)
                    </p>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-56 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setSelectedSticker('')}
                        className={`h-10 rounded-xl border text-[11px] font-bold cursor-pointer ${
                          selectedSticker === ''
                            ? 'border-[#FF0080] bg-[#FF0080]/20'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        None
                      </button>
                      {POST_STICKERS_120.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          title={st.label}
                          aria-label={st.label}
                          onClick={() => setSelectedSticker(st.symbol)}
                          className={`h-10 rounded-xl text-xl flex items-center justify-center border cursor-pointer ${
                            selectedSticker === st.symbol
                              ? 'border-[#FF0080] bg-[#FF0080]/20'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          {st.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* ACTIVE TOOL CONTROLS */}
                  <div className="p-3.5 space-y-3.5 border-b border-white/10">
                    {activeTool === 'adjust' && (
                      <div data-testid="adjustment-panel" className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Light &amp; Exposure Adjustments</p>
                          <button
                            type="button"
                            onClick={() => {
                              pushHistory();
                              setLumetri(DEFAULT_LUMETRI);
                            }}
                            className="text-[11px] text-pink-300 underline cursor-pointer"
                          >
                            Reset All
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 p-3 rounded-2xl bg-[#1A0D33] border border-white/10">
                          {(
                            [
                              'exposure',
                              'contrast',
                              'highlights',
                              'shadows',
                              'whites',
                              'blacks',
                              'sharpness',
                            ] as const
                          ).map((key) => (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between text-[11px] capitalize">
                                <span>{key}</span>
                                <span className="font-mono tabular-nums">{lumetri[key]}</span>
                              </div>
                              <input
                                type="range"
                                min={key === 'sharpness' ? 0 : -50}
                                max={key === 'sharpness' ? 100 : 50}
                                value={lumetri[key]}
                                onPointerDown={pushHistory}
                                onChange={(e) =>
                                  setLumetri({ ...lumetri, [key]: Number(e.target.value) })
                                }
                                className="w-full accent-[#9D00FF]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === 'lumetri' && (
                      <div data-testid="lumetri-adjust-panel" className="space-y-3.5">
                        <div className="p-3 rounded-2xl bg-[#1A0D33] border border-white/10 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-amber-300">
                              Lumetri Color Grading · Temperature &amp; Tint
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setLumetri(DEFAULT_LUMETRI);
                              }}
                              className="text-[11px] text-pink-300 underline cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                          {[
                            { key: 'temperature' as const, label: 'Color Temperature (Cool ↔ Warm)', min: -50, max: 50 },
                            { key: 'tint' as const, label: 'Tint (Green ↔ Magenta)', min: -50, max: 50 },
                          ].map((c) => (
                            <div key={c.key} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span>{c.label}</span>
                                <span className="font-mono tabular-nums">{lumetri[c.key]}</span>
                              </div>
                              <input
                                type="range"
                                min={c.min}
                                max={c.max}
                                value={lumetri[c.key]}
                                onPointerDown={pushHistory}
                                onChange={(e) =>
                                  setLumetri({ ...lumetri, [c.key]: Number(e.target.value) })
                                }
                                className="w-full accent-[#FF0080]"
                              />
                            </div>
                          ))}
                        </div>

                        {/* HSL Individual Color Channel Grading */}
                        <div className="p-3 rounded-2xl bg-[#1A0D33] border border-[#9D00FF]/40 space-y-2.5">
                          <p className="text-xs font-bold text-white">
                            HSL Individual Color Grading ({activeHslColor})
                          </p>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 touch-pan-x">
                            {HSL_COLORS.map((c) => (
                              <button
                                key={c.key}
                                type="button"
                                aria-label={`Select ${c.key} HSL channel`}
                                onClick={() => setActiveHslColor(c.key)}
                                className={`shrink-0 w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                                  activeHslColor === c.key ? 'border-white scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                          {(['hue', 'saturation', 'luminance'] as const).map((prop) => (
                            <div key={prop} className="space-y-0.5">
                              <div className="flex justify-between text-[11px] capitalize">
                                <span>
                                  {activeHslColor} {prop}
                                </span>
                                <span className="font-mono tabular-nums">
                                  {lumetri.hsl[activeHslColor][prop]}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={prop === 'hue' ? -30 : -100}
                                max={prop === 'hue' ? 30 : 100}
                                value={lumetri.hsl[activeHslColor][prop]}
                                onPointerDown={pushHistory}
                                onChange={(e) =>
                                  setLumetri({
                                    ...lumetri,
                                    hsl: {
                                      ...lumetri.hsl,
                                      [activeHslColor]: {
                                        ...lumetri.hsl[activeHslColor],
                                        [prop]: Number(e.target.value),
                                      },
                                    },
                                  })
                                }
                                className="w-full accent-[#FF0080]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === 'filters' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">Filter &amp; AR Intensity ({POST_FILTERS_80.length} Presets)</span>
                          <span className="font-mono text-[#FF0080] tabular-nums">
                            {filterIntensity}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={filterIntensity}
                          onChange={(e) => setFilterIntensity(Number(e.target.value))}
                          className="w-full accent-[#FF0080]"
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                          {POST_FILTERS_80.map((flt) => (
                            <button
                              key={flt.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setSelectedPostFilterId(flt.id);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                selectedPostFilterId === flt.id
                                  ? 'bg-[#FF0080]/20 border-[#FF0080]'
                                  : 'bg-[#1A0D33] border-white/10'
                              }`}
                            >
                              <span className="text-[9px] font-mono text-[#FF0080]">{flt.badge}</span>
                              <p className="text-[11px] font-semibold text-white truncate">
                                {flt.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === 'skin' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#1A0D33] border border-emerald-400/35">
                          <div>
                            <p className="text-xs font-bold text-white">AI Precision Face Mask Mode</p>
                            <p className="text-[11px] text-emerald-300/85">
                              Isolates facial skin cleanly from hair, eyes, lips, clothes &amp; background
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFaceMaskEnabled((m) => !m)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                              faceMaskEnabled ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
                            }`}
                          >
                            {faceMaskEnabled ? 'MASK ON' : 'MASK OFF'}
                          </button>
                        </div>

                        {[
                          { key: 'skinSmooth' as const, label: 'Natural Skin Smoothing' },
                          { key: 'skinToneBalance' as const, label: 'Even Skin Tone Balance' },
                        ].map((s) => (
                          <div key={s.key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{s.label}</span>
                              <span className="font-mono text-[#FF0080] tabular-nums">
                                {postRetouch[s.key]}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={postRetouch[s.key]}
                              onChange={(e) =>
                                setPostRetouch({ ...postRetouch, [s.key]: Number(e.target.value) })
                              }
                              className="w-full accent-[#FF0080]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTool === 'retouch' && (
                      <div className="space-y-3">
                        {[
                          { key: 'blemishRemove' as const, label: 'Blemish & Acne Removal' },
                          { key: 'faceGlow' as const, label: 'Face Brighten & Glow' },
                          { key: 'eyesRetouch' as const, label: 'Eyes & Under-Eye Retouch' },
                        ].map((s) => (
                          <div key={s.key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{s.label}</span>
                              <span className="font-mono text-[#FF0080] tabular-nums">
                                {postRetouch[s.key]}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={postRetouch[s.key]}
                              onChange={(e) =>
                                setPostRetouch({ ...postRetouch, [s.key]: Number(e.target.value) })
                              }
                              className="w-full accent-[#FF0080]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTool === 'text' && (
                      <div data-testid="text-overlay-panel" className="space-y-3 p-3 rounded-2xl bg-[#1A0D33] border border-white/10">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white">Timeline Text Overlay</p>
                          <button
                            type="button"
                            onClick={() => {
                              pushHistory();
                              setTextVisible((v) => !v);
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              textVisible ? 'bg-[#FF0080] text-white' : 'bg-white/10 text-purple-200'
                            }`}
                          >
                            {textVisible ? 'Shown on Video' : 'Show on Video'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={textCaption}
                          onChange={(e) => {
                            setTextCaption(e.target.value);
                            if (!textVisible) setTextVisible(true);
                          }}
                          placeholder="On-screen video text overlay..."
                          className="w-full h-9 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF0080]"
                        />
                        <div className="flex items-center gap-2">
                          {(['Neon Glow', 'Minimal Bold', 'Subtitle Box'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setTextStyle(st);
                                setTextVisible(true);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                textStyle === st
                                  ? 'bg-[#FF0080]/25 border-[#FF0080] text-white'
                                  : 'bg-[#090514] border-white/10 text-purple-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === 'templates' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          'Everest 8K Vlog',
                          'Kathmandu Beat Sync',
                          'CapCut Fast Cut',
                          'Pokhara Slow-Mo Travel',
                          'NEP Dance Transition',
                          'Golden Hour Reel',
                        ].map((tpl) => (
                          <button
                            key={tpl}
                            type="button"
                            onClick={() => onNotify(`Applied template: ${tpl}`)}
                            className="p-3 rounded-2xl bg-[#1A0D33] border border-white/10 hover:border-[#FF0080] text-left text-xs font-semibold cursor-pointer"
                          >
                            {tpl}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeTool === 'effects' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['None', 'Neon Sparkles', 'Floating Hearts', 'Cyber Glitch', 'Dream Blur', 'Zoom Pulse'].map(
                          (fx) => (
                            <button
                              key={fx}
                              type="button"
                              onClick={() => setSelectedEffectOverlay(fx)}
                              className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                                selectedEffectOverlay === fx
                                  ? 'bg-[#FF0080]/20 border-[#FF0080]'
                                  : 'bg-[#1A0D33] border-white/10'
                              }`}
                            >
                              {fx}
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {activeTool === 'stickers' && (
                      <div data-testid="stickers-library-panel" className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">
                            Stickers ({POST_STICKERS_120.length} Available)
                          </span>
                          <input
                            type="text"
                            value={stickerSearch}
                            onChange={(e) => setStickerSearch(e.target.value)}
                            placeholder="Filter stickers..."
                            className="h-7 px-2.5 rounded-lg bg-[#090514] border border-white/15 text-[11px] text-white w-36 focus:outline-none focus:border-[#FF0080]"
                          />
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-60 overflow-y-auto pr-1">
                          <button
                            type="button"
                            onClick={() => setSelectedSticker('')}
                            className={`h-10 rounded-xl border text-[11px] font-bold cursor-pointer ${
                              selectedSticker === ''
                                ? 'bg-[#FF0080]/25 border-[#FF0080]'
                                : 'bg-[#1A0D33] border-white/10'
                            }`}
                          >
                            None
                          </button>
                          {POST_STICKERS_120.filter((st) =>
                            !stickerSearch.trim() ||
                            st.label.toLowerCase().includes(stickerSearch.toLowerCase())
                          ).map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              title={st.label}
                              aria-label={st.label}
                              onClick={() => setSelectedSticker(st.symbol)}
                              className={`h-10 rounded-xl border text-lg flex items-center justify-center cursor-pointer ${
                                selectedSticker === st.symbol
                                  ? 'bg-[#FF0080]/25 border-[#FF0080]'
                                  : 'bg-[#1A0D33] border-white/10 hover:border-white/30'
                              }`}
                            >
                              {st.symbol}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTool === 'ai-video' && (
                      <form onSubmit={handleGenerateAiVideo} className="space-y-3 p-3.5 rounded-2xl bg-[#1A0D33] border border-[#FF0080]/35">
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#FF0080]" />
                            <span>Generate Video from Text</span>
                          </p>
                          <p className="text-[11px] text-purple-200/75 mt-0.5">
                            Powered by Gemini Omni Video generation into your NepTok timeline.
                          </p>
                        </div>
                        <textarea
                          rows={3}
                          value={aiVideoPrompt}
                          onChange={(e) => setAiVideoPrompt(e.target.value)}
                          placeholder="Describe your video scene (e.g., Golden hour drone flight over Boudhanath Stupa in Kathmandu)..."
                          className="w-full p-3 rounded-xl bg-[#090514] border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF0080]"
                        />
                        <div className="flex items-center gap-2">
                          {(['9:16', '16:9'] as const).map((ratio) => (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setAiVideoAspect(ratio)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                                aiVideoAspect === ratio
                                  ? 'bg-[#FF0080]/25 border-[#FF0080] text-white'
                                  : 'bg-[#090514] border-white/10 text-purple-200'
                              }`}
                            >
                              {ratio === '9:16' ? '9:16 Vertical' : '16:9 Landscape'}
                            </button>
                          ))}
                        </div>
                        {aiVideoError && (
                          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200">
                            {aiVideoError}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={aiVideoLoading || !aiVideoPrompt.trim()}
                          className="w-full h-10 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold text-white cursor-pointer disabled:opacity-50"
                        >
                          {aiVideoLoading ? 'Generating Video...' : 'Generate AI Video'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* STACKED MULTI-TRACK TIMELINE:
                      Top->Bottom: Overlay/Cutout -> Text/Caption -> Audio 1 & Audio 2 -> Main Video Track (V1 with + button) */}
                  {selectedOption !== 'photo' && (
                    <div
                      data-testid="capcut-timeline-editor"
                      className="p-3.5 border-b border-white/10 bg-[#0D061C] space-y-2.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 text-[#FF0080]" />
                            <span>Multi-Track Timeline ({outputDurationSec}s)</span>
                          </p>
                          <p className="text-[10px] text-purple-200/75">
                            Playhead {playhead.toFixed(1)}s · Volume {volumeLevel}%{volumeDucking ? ' · Ducking On' : ''}
                            {beatMarkers.length > 0 ? ` · ${beatMarkers.length} Beats` : ''}
                          </p>
                        </div>
                        <select
                          value={transitionType}
                          onChange={(e) => setTransitionType(e.target.value)}
                          aria-label="Transition style"
                          className="bg-[#140A26] border border-white/15 rounded-lg px-2 py-1 text-[11px]"
                        >
                          <option>Cross Dissolve</option>
                          <option>Neon Flash</option>
                          <option>Whip Pan</option>
                        </select>
                      </div>

                      {voiceoverError && (
                        <p className="text-[11px] text-amber-300 px-1">{voiceoverError}</p>
                      )}

                      {/* UNIFIED STACKED TRACK LANES WITH TOUCH/POINTER-DRAGGABLE PLAYHEAD RULER & CURSOR */}
                      <div className="rounded-2xl bg-[#140A26] border border-white/10 p-2 space-y-2 overflow-hidden">
                        {/* Smooth Touch/Pointer-Draggable Timeline Playhead Ruler */}
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-[10px] font-mono font-bold text-pink-300 tabular-nums">
                            {playhead.toFixed(1)}s
                          </span>
                          <div
                            ref={playheadRulerRef}
                            data-testid="timeline-playhead-ruler"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              updatePlayheadFromClientX(e.clientX);
                              setScrubbingPlayhead(true);
                            }}
                            className="relative flex-1 min-w-0 h-6 rounded-lg bg-[#090514] border border-white/15 flex items-center justify-between px-2 text-[9px] font-mono text-purple-300/80 select-none touch-none cursor-ew-resize"
                          >
                            <span>0s</span>
                            <span>{Math.round(timelineMaxSec / 2)}s</span>
                            <span>{timelineMaxSec}s</span>
                            {/* Draggable Playhead Cursor Handle */}
                            <div
                              role="slider"
                              aria-label="Timeline playhead cursor"
                              aria-valuemin={0}
                              aria-valuemax={timelineMaxSec}
                              aria-valuenow={playhead}
                              data-testid="timeline-playhead-handle"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setScrubbingPlayhead(true);
                              }}
                              style={{
                                left: `calc(${Math.min(
                                  98,
                                  Math.max(2, (playhead / Math.max(1, timelineMaxSec)) * 100)
                                )}% - 8px)`,
                              }}
                              className="absolute top-0.5 bottom-0.5 w-4 rounded-md bg-gradient-to-b from-[#FF0080] to-white border border-white shadow-[0_0_8px_rgba(255,0,128,0.9)] flex items-center justify-center touch-none cursor-grab active:cursor-grabbing z-30"
                            >
                              <span className="w-0.5 h-3 bg-[#090514] rounded-full" />
                            </div>
                          </div>
                        </div>

                        {/* Stacked Tracks Area (Playhead scoped strictly to tracks) */}
                        <div className="relative space-y-1.5">
                          {/* Continuous Central Vertical Playhead Line */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_#FFFFFF] z-20"
                            style={{
                              left: `calc(72px + (100% - 84px) * ${Math.min(
                                0.98,
                                Math.max(0.02, playhead / Math.max(1, timelineMaxSec))
                              )})`,
                            }}
                          />

                          {/* Subtle Beat Dots Ruler (when Beats toggled on) */}
                          {beatMarkers.length > 0 && (
                            <div className="relative h-2.5 ml-[72px] mr-3 flex items-center">
                              {beatMarkers
                                .filter((_, idx) => idx % 4 === 0)
                                .map((bSec) => (
                                  <span
                                    key={bSec}
                                    aria-hidden="true"
                                    className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#F59E0B]"
                                    style={{
                                      left: `${Math.min(
                                        99,
                                        Math.max(1, (bSec / Math.max(1, timelineMaxSec)) * 100)
                                      )}%`,
                                    }}
                                  />
                                ))}
                            </div>
                          )}

                        {/* 1. OVERLAY / CUTOUT TRACK(S) — Top Layer (Auto-adds Overlay 2, Overlay 3...) */}
                        {overlayTracks.map((ov) => (
                          <div
                            key={ov.id}
                            data-testid={`timeline-overlay-${ov.id}`}
                            className="flex items-center gap-2"
                          >
                            <div className="w-16 shrink-0 flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={ov.visible ? `Hide ${ov.label}` : `Show ${ov.label}`}
                                onClick={() => {
                                  pushHistory();
                                  setOverlayTracks((prev) =>
                                    prev.map((item) =>
                                      item.id === ov.id ? { ...item, visible: !item.visible } : item
                                    )
                                  );
                                }}
                                className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                              >
                                {ov.visible ? (
                                  <Eye className="w-3 h-3 text-cyan-300" />
                                ) : (
                                  <EyeOff className="w-3 h-3 text-purple-300/60" />
                                )}
                              </button>
                              <button
                                type="button"
                                aria-label={ov.muted ? `Unmute ${ov.label}` : `Mute ${ov.label}`}
                                onClick={() =>
                                  setOverlayTracks((prev) =>
                                    prev.map((item) =>
                                      item.id === ov.id ? { ...item, muted: !item.muted } : item
                                    )
                                  )
                                }
                                className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                              >
                                {ov.muted ? (
                                  <VolumeX className="w-3 h-3 text-rose-300" />
                                ) : (
                                  <Volume2 className="w-3 h-3 text-purple-200" />
                                )}
                              </button>
                            </div>

                            <div className="flex-1 min-w-0 h-8 rounded-lg bg-[#090514] border border-cyan-500/30 px-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <img
                                  src={ov.previewUrl}
                                  alt={ov.title}
                                  referrerPolicy="no-referrer"
                                  className="w-5 h-5 rounded object-cover shrink-0 border border-white/20"
                                />
                                <span className="text-[10px] font-bold text-cyan-200 truncate">
                                  {ov.label}: {ov.title}
                                </span>
                              </div>
                              {overlayTracks.length > 1 && (
                                <button
                                  type="button"
                                  aria-label={`Remove ${ov.label}`}
                                  onClick={() => {
                                    pushHistory();
                                    setOverlayTracks((prev) => prev.filter((item) => item.id !== ov.id));
                                  }}
                                  className="p-0.5 rounded bg-white/10 text-rose-300 cursor-pointer shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* 2. TEXT / CAPTION TRACK */}
                        <div data-testid="timeline-text-track" className="flex items-center gap-2">
                          <div className="w-16 shrink-0 flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={textVisible ? 'Hide Text track' : 'Show Text track'}
                              onClick={() => {
                                pushHistory();
                                setTextVisible((v) => !v);
                              }}
                              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                            >
                              {textVisible ? (
                                <Eye className="w-3 h-3 text-pink-300" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-purple-300/60" />
                              )}
                            </button>
                            <button
                              type="button"
                              aria-label={textMuted ? 'Unmute Text track' : 'Mute Text track'}
                              onClick={() => setTextMuted((m) => !m)}
                              className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                            >
                              {textMuted ? (
                                <VolumeX className="w-3 h-3 text-rose-300" />
                              ) : (
                                <Volume2 className="w-3 h-3 text-purple-200" />
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTool('text');
                              setTextVisible(true);
                            }}
                            className={`flex-1 min-w-0 h-8 rounded-lg border px-2 flex items-center justify-between gap-2 text-left cursor-pointer ${
                              textVisible
                                ? 'bg-gradient-to-r from-[#FF0080]/30 to-[#9D00FF]/30 border-[#FF0080]/60'
                                : 'bg-[#090514] border-white/10'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-pink-200 truncate flex items-center gap-1">
                              <Type className="w-3 h-3 shrink-0" />
                              <span>
                                Text: {textCaption} ({textStyle})
                              </span>
                            </span>
                            <span className="text-[9px] text-purple-200/80 shrink-0">Edit</span>
                          </button>
                        </div>

                        {/* 3. MAIN VIDEO TRACK (V1) — Strictly Dedicated Video Layer ABOVE Audio Tracks */}
                        <div data-testid="timeline-video-v1" className="flex items-center gap-2 pt-1 border-t border-white/10">
                            <div className="w-16 shrink-0 flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={videoTrackVisible ? 'Hide Video track' : 'Show Video track'}
                                onClick={() => setVideoTrackVisible((v) => !v)}
                                className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                              >
                                {videoTrackVisible ? (
                                  <Eye className="w-3 h-3 text-white" />
                                ) : (
                                  <EyeOff className="w-3 h-3 text-purple-300/60" />
                                )}
                              </button>
                              <span className="text-[10px] font-mono font-bold text-pink-300 px-1">
                                V1
                              </span>
                            </div>

                            <div
                              data-timeline-lane="true"
                              onClick={(e) => {
                                if (e.target !== e.currentTarget) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
                                setPlayhead(Number((pct * timelineMaxSec).toFixed(1)));
                              }}
                              className="relative flex-1 min-w-0 h-11 rounded-lg bg-[#090514] border border-white/15 overflow-hidden cursor-crosshair"
                            >
                              {clips.map((clip) => {
                                const leftPct = Math.max(0, Math.min(92, (clip.start / Math.max(1, timelineMaxSec)) * 100));
                                const widthPct = Math.max(
                                  10,
                                  Math.min(100 - leftPct, ((clip.end - clip.start) / Math.max(1, timelineMaxSec)) * 100)
                                );
                                const isSelected = activeTrackKind === 'video' && clip.id === activeClip?.id;
                                return (
                                  <div
                                    key={clip.id}
                                    data-testid={`video-clip-${clip.id}`}
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveTrackKind('video');
                                      setSelectedClipId(clip.id);
                                    }}
                                    className={`absolute top-0.5 bottom-0.5 rounded-md overflow-hidden border flex items-stretch select-none ${
                                      isSelected
                                        ? 'border-white ring-1 ring-[#FF0080] z-10'
                                        : 'border-white/25 opacity-90'
                                    }`}
                                  >
                                    {/* Miniature Frame Strip Backdrop */}
                                    <img
                                      src={thumbnailUrl || mediaUrl}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
                                    />
                                    {/* Left Trim / Extend Handle */}
                                    <div
                                      role="slider"
                                      aria-label={`Trim start ${clip.label}`}
                                      aria-valuenow={clip.start}
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        const lane = e.currentTarget.closest('[data-timeline-lane="true"]');
                                        const laneWidth = lane?.getBoundingClientRect().width || 240;
                                        pushHistory();
                                        setActiveTrackKind('video');
                                        setSelectedClipId(clip.id);
                                        setDragState({
                                          kind: 'video',
                                          clipId: clip.id,
                                          edge: 'start',
                                          startX: e.clientX,
                                          laneWidth,
                                          origClips: clips.map((c) => ({ ...c })),
                                        });
                                      }}
                                      className="relative z-10 w-2.5 shrink-0 bg-[#FF0080] hover:bg-white cursor-ew-resize flex items-center justify-center"
                                    >
                                      <span className="w-0.5 h-4 bg-white/90 rounded-full" />
                                    </div>
                                    {/* Body Drag to Move */}
                                    <div
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        const lane = e.currentTarget.closest('[data-timeline-lane="true"]');
                                        const laneWidth = lane?.getBoundingClientRect().width || 240;
                                        pushHistory();
                                        setActiveTrackKind('video');
                                        setSelectedClipId(clip.id);
                                        setDragState({
                                          kind: 'video',
                                          clipId: clip.id,
                                          edge: 'move',
                                          startX: e.clientX,
                                          laneWidth,
                                          origClips: clips.map((c) => ({ ...c })),
                                        });
                                      }}
                                      className="relative z-10 flex-1 min-w-0 px-1.5 flex items-center justify-between cursor-grab active:cursor-grabbing"
                                    >
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-white truncate drop-shadow">
                                          {clip.label}
                                        </p>
                                        <p className="text-[9px] font-mono text-purple-100 drop-shadow">
                                          {clip.start}s–{clip.end}s{clipSpeed !== 1 ? ` · ${clipSpeed}x` : ''}
                                        </p>
                                      </div>
                                    </div>
                                    {/* Right Trim / Extend Handle */}
                                    <div
                                      role="slider"
                                      aria-label={`Trim end ${clip.label}`}
                                      aria-valuenow={clip.end}
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        const lane = e.currentTarget.closest('[data-timeline-lane="true"]');
                                        const laneWidth = lane?.getBoundingClientRect().width || 240;
                                        pushHistory();
                                        setActiveTrackKind('video');
                                        setSelectedClipId(clip.id);
                                        setDragState({
                                          kind: 'video',
                                          clipId: clip.id,
                                          edge: 'end',
                                          startX: e.clientX,
                                          laneWidth,
                                          origClips: clips.map((c) => ({ ...c })),
                                        });
                                      }}
                                      className="relative z-10 w-2.5 shrink-0 bg-[#FF0080] hover:bg-white cursor-ew-resize flex items-center justify-center"
                                    >
                                      <span className="w-0.5 h-4 bg-white/90 rounded-full" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* + Button to Add More Clips to Video Track */}
                            <button
                              type="button"
                              aria-label="Add more video clip"
                              title="Add More Clips"
                              onClick={handleAddMoreClip}
                              className="w-9 h-11 rounded-lg bg-gradient-to-br from-[#FF0080] to-[#9D00FF] text-white flex items-center justify-center shrink-0 shadow cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                        {/* 4. AUDIO 1 & AUDIO 2 TRACKS — Strictly Positioned UNDERNEATH Main Video Track V1 */}
                        {audioTracks.map((trk, rawIdx) => {
                          const trackIdx = rawIdx as 0 | 1;
                          const isThisTrackRecording = recordingTrackIdx === trackIdx;
                          return (
                            <div
                              key={trk.id}
                              data-testid={`timeline-audio-${trk.id}`}
                              className="space-y-1 pt-1 border-t border-white/10"
                            >
                              <div className="flex items-center gap-2">
                                {/* Left Visibility (Eye) + Mute (Speaker) */}
                                <div className="w-16 shrink-0 flex items-center gap-1">
                                  <button
                                    type="button"
                                    aria-label={trk.visible ? `Hide ${trk.label}` : `Show ${trk.label}`}
                                    onClick={() =>
                                      setAudioTracks((prev) =>
                                        prev.map((item, i) =>
                                          i === trackIdx ? { ...item, visible: !item.visible } : item
                                        )
                                      )
                                    }
                                    className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                                  >
                                    {trk.visible ? (
                                      <Eye className="w-3 h-3 text-emerald-300" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-purple-300/60" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={trk.muted ? `Unmute ${trk.label}` : `Mute ${trk.label}`}
                                    onClick={() =>
                                      setAudioTracks((prev) =>
                                        prev.map((item, i) =>
                                          i === trackIdx
                                            ? {
                                                ...item,
                                                muted: !item.muted,
                                                segments: item.segments.map((s) => ({
                                                  ...s,
                                                  muted: !item.muted,
                                                })),
                                              }
                                            : item
                                        )
                                      )
                                    }
                                    className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                                  >
                                    {trk.muted ? (
                                      <VolumeX className="w-3 h-3 text-rose-300" />
                                    ) : (
                                      <Volume2 className="w-3 h-3 text-emerald-300" />
                                    )}
                                  </button>
                                </div>

                                {/* Dedicated Audio Waveform Lane with Interactive Trim / Extend / Move / Split Segments */}
                                <div
                                  data-timeline-lane="true"
                                  onClick={(e) => {
                                    if (e.target !== e.currentTarget) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
                                    setPlayhead(Number((pct * timelineMaxSec).toFixed(1)));
                                  }}
                                  className="relative flex-1 min-w-0 h-9 rounded-lg bg-[#090514] border border-emerald-500/20 overflow-hidden cursor-crosshair"
                                >
                                  {trk.segments.length > 0 && trk.visible ? (
                                    trk.segments.map((seg) => {
                                      const leftPct = Math.max(0, Math.min(92, (seg.start / Math.max(1, timelineMaxSec)) * 100));
                                      const widthPct = Math.max(
                                        10,
                                        Math.min(100 - leftPct, ((seg.end - seg.start) / Math.max(1, timelineMaxSec)) * 100)
                                      );
                                      const isSelectedSeg =
                                        activeTrackKind === 'audio' &&
                                        selectedAudioTarget?.trackIdx === trackIdx &&
                                        selectedAudioTarget.clipId === seg.id;
                                      return (
                                        <div
                                          key={seg.id}
                                          data-testid={`audio-seg-${seg.id}`}
                                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTrackKind('audio');
                                            setSelectedAudioTarget({ trackIdx, clipId: seg.id });
                                          }}
                                          className={`absolute top-0.5 bottom-0.5 rounded bg-emerald-500/20 border overflow-hidden flex items-stretch select-none ${
                                            isSelectedSeg
                                              ? 'border-amber-300 ring-1 ring-amber-400 z-10'
                                              : 'border-emerald-400/50'
                                          }`}
                                        >
                                          {/* Left Amber Trim / Extend Handle */}
                                          <div
                                            role="slider"
                                            aria-label={`Trim start ${seg.label}`}
                                            aria-valuenow={seg.start}
                                            onPointerDown={(e) => {
                                              e.stopPropagation();
                                              const lane = e.currentTarget.closest('[data-timeline-lane="true"]');
                                              const laneWidth = lane?.getBoundingClientRect().width || 240;
                                              setActiveTrackKind('audio');
                                              setSelectedAudioTarget({ trackIdx, clipId: seg.id });
                                              setDragState({
                                                kind: 'audio',
                                                trackIdx,
                                                clipId: seg.id,
                                                edge: 'start',
                                                startX: e.clientX,
                                                laneWidth,
                                                origClips: [],
                                                origAudioSegs: trk.segments.map((s) => ({ ...s })),
                                              });
                                            }}
                                            className="relative z-10 w-2 shrink-0 bg-amber-400 hover:bg-white cursor-ew-resize"
                                          />
                                          {/* Waveform + Body Drag to Move */}
                                          <div
                                            onPointerDown={(e) => {
                                              e.stopPropagation();
                                              const lane = e.currentTarget.closest('[data-timeline-lane="true"]');
                                              const laneWidth = lane?.getBoundingClientRect().width || 240;
                                              setActiveTrackKind('audio');
                                              setSelectedAudioTarget({ trackIdx, clipId: seg.id });
                                              setDragState({
                                                kind: 'audio',
                                                trackIdx,
                                                clipId: seg.id,
                                                edge: 'move',
                                                startX: e.clientX,
                                                laneWidth,
                                                origClips: [],
                                                origAudioSegs: trk.segments.map((s) => ({ ...s })),
                                              });
                                            }}
                                            className="relative flex-1 min-w-0 px-1 flex items-center justify-between gap-1 cursor-grab active:cursor-grabbing"
                                          >
                                            {/* Audio Waveform Bars Strip */}
                                            <div
                                              data-testid={`audio-waveform-${trk.id}`}
                                              aria-hidden="true"
                                              className="absolute inset-x-0 bottom-0.5 h-3.5 flex items-end gap-[2px] px-1 opacity-45 pointer-events-none overflow-hidden"
                                            >
                                              {Array.from({ length: 28 }).map((_, bi) => (
                                                <span
                                                  key={bi}
                                                  className="w-1 rounded-t bg-emerald-300 shrink-0"
                                                  style={{
                                                    height: `${35 + ((bi * 37) % 65)}%`,
                                                  }}
                                                />
                                              ))}
                                            </div>
                                            <span
                                              className={`relative z-10 text-[9px] font-bold truncate drop-shadow ${
                                                seg.isVoiceover ? 'text-pink-200' : 'text-emerald-100'
                                              }`}
                                            >
                                              {seg.isVoiceover ? '🎙️' : '♪'} {seg.label} ({seg.start}s–{seg.end}s)
                                            </span>
                                            <button
                                              type="button"
                                              aria-label={`Remove ${seg.label} from ${trk.label}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setAudioTracks((prev) =>
                                                  prev.map((item, i) =>
                                                    i === trackIdx
                                                      ? {
                                                          ...item,
                                                          segments: item.segments.filter((s) => s.id !== seg.id),
                                                        }
                                                      : item
                                                  )
                                                );
                                              }}
                                              className="relative z-10 p-0.5 rounded bg-black/50 text-rose-300 cursor-pointer shrink-0"
                                            >
                                              <X className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                          {/* Right Amber Trim / Extend Handle */}
                                          <div
                                            role="slider"
                                            aria-label={`Trim end ${seg.label}`}
                                            aria-valuenow={seg.end}
                                            onPointerDown={(e) => {
                                              e.stopPropagation();
                                              const lane = e.currentTarget.closest('[data-timeline-lane="true"]');
                                              const laneWidth = lane?.getBoundingClientRect().width || 240;
                                              setActiveTrackKind('audio');
                                              setSelectedAudioTarget({ trackIdx, clipId: seg.id });
                                              setDragState({
                                                kind: 'audio',
                                                trackIdx,
                                                clipId: seg.id,
                                                edge: 'end',
                                                startX: e.clientX,
                                                laneWidth,
                                                origClips: [],
                                                origAudioSegs: trk.segments.map((s) => ({ ...s })),
                                              });
                                            }}
                                            className="relative z-10 w-2 shrink-0 bg-amber-400 hover:bg-white cursor-ew-resize"
                                          />
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="h-full flex items-center px-2">
                                      <span className="text-[10px] text-purple-200/50 truncate">
                                        {trk.label} (Audio Layer) — tap mic or music
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Side-by-Side Record Voiceover & Add Audio */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    title={`Record Voiceover (${trk.label})`}
                                    aria-label={`Record Voiceover ${trk.label}`}
                                    onClick={() => handleToggleVoiceoverRecording(trackIdx)}
                                    className={`w-7 h-7 rounded-lg border flex items-center justify-center cursor-pointer ${
                                      isThisTrackRecording
                                        ? 'bg-rose-600 border-white text-white animate-pulse'
                                        : 'bg-[#FF0080]/20 border-[#FF0080]/60 text-pink-200 hover:bg-[#FF0080]/35'
                                    }`}
                                  >
                                    {isThisTrackRecording ? (
                                      <Square className="w-3 h-3" />
                                    ) : (
                                      <Mic className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title={`Add Audio (${trk.label})`}
                                    aria-label={`Add Audio ${trk.label}`}
                                    onClick={() => {
                                      setTargetAudioTrackIdx(trackIdx);
                                      setLibraryPickerTrackIdx((prev) =>
                                        prev === trackIdx ? null : trackIdx
                                      );
                                    }}
                                    className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/35 flex items-center justify-center cursor-pointer"
                                  >
                                    <Music className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Optional Audio Library Picker */}
                              {libraryPickerTrackIdx === trackIdx && (
                                <div className="ml-18 pl-2 space-y-1.5 pt-1 border-t border-white/10">
                                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTargetAudioTrackIdx(trackIdx);
                                        audioFileInputRef.current?.click();
                                      }}
                                      className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>Device File</span>
                                    </button>
                                    {LIBRARY_AUDIO_TRACKS.map((lib) => (
                                      <button
                                        key={lib.id}
                                        type="button"
                                        onClick={() => {
                                          const startSec = Number(
                                            Math.min(playhead, Math.max(0, timelineMaxSec - 4)).toFixed(1)
                                          );
                                          const endSec = Number(
                                            Math.min(timelineMaxSec, startSec + lib.durationSec).toFixed(1)
                                          );
                                          const newSegId = `a${trackIdx + 1}-lib-${Date.now()}`;
                                          setAudioTracks((prev) =>
                                            prev.map((item, i) =>
                                              i === trackIdx
                                                ? {
                                                    ...item,
                                                    visible: true,
                                                    segments: [
                                                      ...item.segments,
                                                      {
                                                        id: newSegId,
                                                        label: lib.title,
                                                        start: startSec,
                                                        end: endSec,
                                                        muted: false,
                                                      },
                                                    ],
                                                  }
                                                : item
                                            )
                                          );
                                          setActiveTrackKind('audio');
                                          setSelectedAudioTarget({ trackIdx, clipId: newSegId });
                                          setLibraryPickerTrackIdx(null);
                                          onNotify(`Added "${lib.title}" to ${trk.label}`);
                                        }}
                                        className="shrink-0 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-semibold cursor-pointer"
                                      >
                                        + {lib.title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>

                          {/* Active Clip Trim Start/End & Split/Delete/Reset */}
                          {activeClip && activeTrackKind === 'video' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <label className="flex flex-col gap-0.5">
                                <span className="flex justify-between text-purple-200">
                                  <span>Trim Start Handle</span>
                                  <span className="font-mono text-[#FF0080]">{activeClip.start}s</span>
                                </span>
                                <input
                                  type="range"
                                  min={0}
                                  max={Math.max(0, activeClip.end - 1)}
                                  step={1}
                                  value={activeClip.start}
                                  onPointerDown={pushHistory}
                                  onChange={(e) => handleUpdateClipBound('start', Number(e.target.value))}
                                  className="w-full accent-[#FF0080]"
                                />
                              </label>
                              <label className="flex flex-col gap-0.5">
                                <span className="flex justify-between text-purple-200">
                                  <span>Trim End Handle</span>
                                  <span className="font-mono text-[#9D00FF]">{activeClip.end}s</span>
                                </span>
                                <input
                                  type="range"
                                  min={Math.min(timelineMaxSec, activeClip.start + 1)}
                                  max={timelineMaxSec}
                                  step={1}
                                  value={activeClip.end}
                                  onPointerDown={pushHistory}
                                  onChange={(e) => handleUpdateClipBound('end', Number(e.target.value))}
                                  className="w-full accent-[#9D00FF]"
                                />
                              </label>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={handleSplitAtPlayhead}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Scissors className="w-3 h-3" />
                              <span>Split ({playhead.toFixed(1)}s)</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleDeleteSelectedClip}
                              disabled={clips.length <= 1}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-600/30 disabled:opacity-40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 text-rose-300" />
                              <span>Delete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setClips([{ id: 'clip-1', label: 'Main Video', start: 0, end: 45 }]);
                                setSelectedClipId('clip-1');
                                setActiveTrackKind('video');
                                onNotify('Reset timeline clips');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </button>
                          </div>
                      </div>

                      {/* WORKING HORIZONTAL BOTTOM ACTION TOOLBAR (Every button functions!) */}
                      <div className="space-y-2 pt-1">
                        <div
                          data-testid="editor-bottom-toolbar"
                          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 touch-pan-x"
                        >
                          {[
                            {
                              id: 'remove-bg',
                              label: 'Remove Bg',
                              icon: ScissorsLineDashed,
                              active: removeBgEnabled,
                              onClick: () => {
                                pushHistory();
                                setRemoveBgEnabled((v) => !v);
                                onNotify(!removeBgEnabled ? 'Removed background' : 'Restored background');
                              },
                            },
                            {
                              id: 'green-screen',
                              label: 'Green Screen',
                              icon: Layers,
                              active: chromaKey.enabled || activeBottomTool === 'green-screen',
                              onClick: () =>
                                setActiveBottomTool((t) => (t === 'green-screen' ? 'none' : 'green-screen')),
                            },
                            {
                              id: 'overlay',
                              label: 'Overlay',
                              icon: ImagePlus,
                              active: activeBottomTool === 'overlay',
                              onClick: () =>
                                setActiveBottomTool((t) => (t === 'overlay' ? 'none' : 'overlay')),
                            },
                            {
                              id: 'audio',
                              label: 'Audio',
                              icon: Music,
                              active: libraryPickerTrackIdx === 0,
                              onClick: () => {
                                setTargetAudioTrackIdx(0);
                                setLibraryPickerTrackIdx((p) => (p === 0 ? null : 0));
                              },
                            },
                            {
                              id: 'sfx',
                              label: 'Sound Effects',
                              icon: Zap,
                              active: activeBottomTool === 'sfx',
                              onClick: () => setActiveBottomTool((t) => (t === 'sfx' ? 'none' : 'sfx')),
                            },
                            {
                              id: 'fade',
                              label: 'Fade In/Out',
                              icon: SlidersHorizontal,
                              active: fadeInSec > 0 || fadeOutSec > 0 || activeBottomTool === 'fade',
                              onClick: () => setActiveBottomTool((t) => (t === 'fade' ? 'none' : 'fade')),
                            },
                            {
                              id: 'ducking',
                              label: 'Volume Ducking',
                              icon: VolumeX,
                              active: volumeDucking,
                              onClick: () => {
                                pushHistory();
                                setVolumeDucking((d) => !d);
                                onNotify(!volumeDucking ? 'Enabled Auto Volume Ducking' : 'Disabled Volume Ducking');
                              },
                            },
                            {
                              id: 'volume',
                              label: 'Volume',
                              icon: Volume2,
                              active: activeBottomTool === 'volume',
                              onClick: () =>
                                setActiveBottomTool((t) => (t === 'volume' ? 'none' : 'volume')),
                            },
                            {
                              id: 'beats',
                              label: 'Beats',
                              icon: Activity,
                              active: beatMarkers.length > 0,
                              onClick: () => {
                                pushHistory();
                                if (beatMarkers.length > 0) {
                                  setBeatMarkers([]);
                                  onNotify('Cleared beat markers');
                                } else {
                                  const next = generateBeatMarkers(timelineMaxSec, 120);
                                  setBeatMarkers(next);
                                  onNotify(`Detected ${next.length} music beat markers`);
                                }
                              },
                            },
                            {
                              id: 'edit',
                              label: 'Edit',
                              icon: Scissors,
                              active: activeBottomTool === 'edit',
                              onClick: () => setActiveBottomTool((t) => (t === 'edit' ? 'none' : 'edit')),
                            },
                            {
                              id: 'replace',
                              label: 'Replace',
                              icon: RefreshCw,
                              active: false,
                              onClick: () => fileInputRef.current?.click(),
                            },
                            {
                              id: 'copy',
                              label: 'Copy',
                              icon: Copy,
                              active: Boolean(copiedClipBuffer),
                              onClick: () => {
                                if (!activeClip) return;
                                setCopiedClipBuffer({ ...activeClip });
                                onNotify(`Copied "${activeClip.label}" to clipboard`);
                              },
                            },
                            {
                              id: 'duplicate',
                              label: 'Duplicate',
                              icon: CopyPlus,
                              active: false,
                              onClick: handleDuplicateSelectedClip,
                            },
                            {
                              id: 'slip',
                              label: 'Slip',
                              icon: MoveHorizontal,
                              active: activeBottomTool === 'slip',
                              onClick: () => setActiveBottomTool((t) => (t === 'slip' ? 'none' : 'slip')),
                            },
                          ].map((tool) => {
                            const Icon = tool.icon;
                            return (
                              <button
                                key={tool.id}
                                type="button"
                                onClick={tool.onClick}
                                className={`shrink-0 px-2.5 py-2 rounded-xl border flex flex-col items-center gap-1 min-w-[66px] cursor-pointer ${
                                  tool.active
                                    ? 'bg-[#FF0080]/25 border-[#FF0080] text-white'
                                    : 'bg-[#150B2B] border-white/10 text-purple-100 hover:border-white/30'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold whitespace-nowrap">
                                  {tool.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Interactive Contextual Drawer for Bottom Toolbar Tools */}
                        {activeBottomTool === 'green-screen' && (
                          <div className="p-2.5 rounded-xl bg-[#150B2B] border border-emerald-400/40 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-300">Green Screen / Chroma Key</span>
                              <button
                                type="button"
                                onClick={() => {
                                  pushHistory();
                                  setChromaKey((c) => ({ ...c, enabled: !c.enabled }));
                                }}
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                                  chromaKey.enabled ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
                                }`}
                              >
                                {chromaKey.enabled ? 'ON' : 'OFF'}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              {['#22C55E', '#3B82F6', '#06B6D4'].map((hex) => (
                                <button
                                  key={hex}
                                  type="button"
                                  aria-label={`Chroma key ${hex}`}
                                  onClick={() => setChromaKey((c) => ({ ...c, enabled: true, color: hex }))}
                                  style={{ backgroundColor: hex }}
                                  className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                                    chromaKey.color === hex ? 'border-white' : 'border-transparent'
                                  }`}
                                />
                              ))}
                              <input
                                type="range"
                                min={10}
                                max={100}
                                value={chromaKey.intensity}
                                onChange={(e) =>
                                  setChromaKey((c) => ({ ...c, enabled: true, intensity: Number(e.target.value) }))
                                }
                                className="flex-1 accent-emerald-400"
                              />
                              <span className="font-mono text-[11px]">{chromaKey.intensity}%</span>
                            </div>
                          </div>
                        )}

                        {activeBottomTool === 'overlay' && (
                          <div className="p-2.5 rounded-xl bg-[#150B2B] border border-cyan-400/40 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-300">Add Overlay Track (Stacks Overlay 2, 3...)</span>
                              <button
                                type="button"
                                onClick={() => overlayFileInputRef.current?.click()}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 text-[11px] font-bold cursor-pointer"
                              >
                                + Upload Overlay
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                              {OVERLAY_PRESETS.map((ov) => (
                                <button
                                  key={ov.id}
                                  type="button"
                                  onClick={() => handleAddPresetOverlay(ov.title, ov.url)}
                                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold cursor-pointer"
                                >
                                  + {ov.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeBottomTool === 'sfx' && (
                          <div className="p-2.5 rounded-xl bg-[#150B2B] border border-[#FF0080]/40 space-y-2 text-xs">
                            <p className="font-bold text-pink-300">Insert Sound Effect onto Audio 2</p>
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                              {SFX_PRESETS.map((sfx) => (
                                <button
                                  key={sfx.id}
                                  type="button"
                                  onClick={() => {
                                    const startSec = Number(Math.min(playhead, Math.max(0, timelineMaxSec - 3)).toFixed(1));
                                    const endSec = Number(Math.min(timelineMaxSec, startSec + Math.max(2, sfx.durationSec)).toFixed(1));
                                    const newSegId = `a2-sfx-${Date.now()}`;
                                    setAudioTracks((prev) =>
                                      prev.map((trk, idx) =>
                                        idx === 1
                                          ? {
                                              ...trk,
                                              visible: true,
                                              segments: [
                                                ...trk.segments,
                                                {
                                                  id: newSegId,
                                                  label: sfx.title,
                                                  start: startSec,
                                                  end: endSec,
                                                  muted: false,
                                                },
                                              ],
                                            }
                                          : trk
                                      )
                                    );
                                    setActiveTrackKind('audio');
                                    setSelectedAudioTarget({ trackIdx: 1, clipId: newSegId });
                                    setActiveBottomTool('none');
                                    onNotify(`Added SFX "${sfx.title}" to Audio 2`);
                                  }}
                                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#FF0080]/25 text-[11px] font-semibold cursor-pointer"
                                >
                                  + {sfx.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeBottomTool === 'fade' && (
                          <div className="p-2.5 rounded-xl bg-[#150B2B] border border-white/15 grid grid-cols-2 gap-3 text-xs">
                            <label className="space-y-1">
                              <span className="flex justify-between text-[11px]">
                                <span>Fade In</span>
                                <span className="font-mono text-[#FF0080]">{fadeInSec}s</span>
                              </span>
                              <input
                                type="range"
                                min={0}
                                max={5}
                                step={0.5}
                                value={fadeInSec}
                                onPointerDown={pushHistory}
                                onChange={(e) => setFadeInSec(Number(e.target.value))}
                                className="w-full accent-[#FF0080]"
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="flex justify-between text-[11px]">
                                <span>Fade Out</span>
                                <span className="font-mono text-[#9D00FF]">{fadeOutSec}s</span>
                              </span>
                              <input
                                type="range"
                                min={0}
                                max={5}
                                step={0.5}
                                value={fadeOutSec}
                                onPointerDown={pushHistory}
                                onChange={(e) => setFadeOutSec(Number(e.target.value))}
                                className="w-full accent-[#9D00FF]"
                              />
                            </label>
                          </div>
                        )}

                        {activeBottomTool === 'volume' && (
                          <div className="p-2.5 rounded-xl bg-[#150B2B] border border-white/15 space-y-1 text-xs">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold">Master Clip Volume</span>
                              <span className="font-mono text-emerald-300">{volumeLevel}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={200}
                              value={volumeLevel}
                              onPointerDown={pushHistory}
                              onChange={(e) => setVolumeLevel(Number(e.target.value))}
                              className="w-full accent-emerald-400"
                            />
                          </div>
                        )}

                        {activeBottomTool === 'edit' && (
                          <div className="p-2.5 rounded-xl bg-[#150B2B] border border-white/15 flex items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-purple-200">
                              Active: <strong className="text-white">{activeClip?.label}</strong>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleSplitAtPlayhead}
                                className="px-2.5 py-1 rounded-lg bg-[#FF0080] text-white text-[11px] font-bold cursor-pointer"
                              >
                                Split Here
                              </button>
                              <button
                                type="button"
                                onClick={handleAddMoreClip}
                                className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[11px] font-bold cursor-pointer"
                              >
                                + Add Clip
                              </button>
                            </div>
                          </div>
                        )}

                        {activeBottomTool === 'slip' && (
                          <div className="p-2.5 rounded-xl bg-[#150B2B] border border-white/15 flex items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] font-bold text-purple-200">
                              Slip Active Clip Window
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSlipSelectedClip(-2)}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold cursor-pointer"
                              >
                                ← -2s
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSlipSelectedClip(2)}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold cursor-pointer"
                              >
                                +2s →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* EDITOR BOTTOM FOOTER: NO Title Input Here! Only CapCut Studio + Save Draft + Next > */}
            <div className="p-3 bg-[#090514] border-t border-white/10 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNotify('Opened CapCut Studio handoff & templates')}
                  className="px-3 py-1.5 rounded-xl bg-white text-black text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Scissors className="w-3 h-3" />
                  <span>CapCut Studio</span>
                </button>
                <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AI Safety Guard</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePublish(true)}
                  className="px-4 h-9 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStage('publish')}
                  className="px-4 h-9 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs font-bold text-white shadow-lg shadow-[#FF0080]/35 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: Dedicated Publish Page (Title, Thumbnail, #Hashtags, Tags, Visibility, Post/Upload CTA) */}
      {stage === 'publish' && (
        <div
          data-testid="publish-stage-page"
          className="flex-1 min-h-0 overflow-y-auto bg-[#090514] p-4 sm:p-6"
        >
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Cover / Thumbnail Card + Change Thumbnail */}
            <div className="p-4 rounded-2xl bg-[#140A26] border border-white/10 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-32 h-44 rounded-xl overflow-hidden bg-black border border-white/15 shrink-0">
                <img
                  src={thumbnailUrl || mediaUrl}
                  alt="Post Cover Thumbnail"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  style={{ filter: computedEditorFilter }}
                />
                <span className="absolute bottom-1.5 inset-x-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-center">
                  Cover · {aspectRatio}
                </span>
              </div>

              <div className="flex-1 w-full space-y-3">
                <div>
                  <h3 className="font-display font-bold text-base text-white">Post Details &amp; Cover</h3>
                  <p className="text-xs text-purple-200/75">
                    Add your title, thumbnail, hashtags, and tags before uploading to NepTok.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => thumbnailFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-[#FF0080]" />
                    <span>Change Thumbnail</span>
                  </button>
                  {OVERLAY_PRESETS.slice(0, 2).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setThumbnailUrl(p.url)}
                      className="px-2.5 py-2 rounded-xl bg-[#1D0F38] border border-white/10 text-[11px] font-semibold cursor-pointer"
                    >
                      Use {p.title.split(' ')[0]} Cover
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dedicated Title Field */}
            <div className="p-4 rounded-2xl bg-[#140A26] border border-white/10 space-y-2">
              <label htmlFor="publish-post-title" className="text-xs font-bold text-purple-100 block">
                Post Title / Description
              </label>
              <textarea
                id="publish-post-title"
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a catchy title for your video or reel..."
                className="w-full p-3 rounded-xl bg-[#090514] border border-white/15 text-sm text-white focus:outline-none focus:border-[#FF0080]"
              />
            </div>

            {/* #Hashtags Manager */}
            <div className="p-4 rounded-2xl bg-[#140A26] border border-white/10 space-y-2.5">
              <label className="text-xs font-bold text-purple-100 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#FF0080]" />
                <span>Hashtags</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hashtagInput.trim()) {
                      e.preventDefault();
                      const formatted = hashtagInput.trim().startsWith('#')
                        ? hashtagInput.trim()
                        : `#${hashtagInput.trim()}`;
                      if (!hashtagsList.includes(formatted)) {
                        setHashtagsList((prev) => [...prev, formatted]);
                      }
                      setHashtagInput('');
                    }
                  }}
                  placeholder="Add hashtag (e.g. #Pokhara)..."
                  className="flex-1 h-9 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs text-white focus:outline-none focus:border-[#FF0080]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!hashtagInput.trim()) return;
                    const formatted = hashtagInput.trim().startsWith('#')
                      ? hashtagInput.trim()
                      : `#${hashtagInput.trim()}`;
                    if (!hashtagsList.includes(formatted)) {
                      setHashtagsList((prev) => [...prev, formatted]);
                    }
                    setHashtagInput('');
                  }}
                  className="px-3 h-9 rounded-xl bg-[#FF0080]/25 border border-[#FF0080]/60 text-xs font-bold cursor-pointer"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hashtagsList.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-[#FF0080]/20 border border-[#FF0080]/40 text-xs font-semibold text-pink-200 flex items-center gap-1.5"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      onClick={() => setHashtagsList((prev) => prev.filter((t) => t !== tag))}
                      className="hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tags & Visibility */}
            <div className="p-4 rounded-2xl bg-[#140A26] border border-white/10 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-purple-100 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#9D00FF]" />
                  <span>Tags &amp; Topics</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        const val = tagInput.trim();
                        if (!tagsList.includes(val)) setTagsList((prev) => [...prev, val]);
                        setTagInput('');
                      }
                    }}
                    placeholder="Add creator or topic tag..."
                    className="flex-1 h-9 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs text-white focus:outline-none focus:border-[#9D00FF]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = tagInput.trim();
                      if (!val) return;
                      if (!tagsList.includes(val)) setTagsList((prev) => [...prev, val]);
                      setTagInput('');
                    }}
                    className="px-3 h-9 rounded-xl bg-[#9D00FF]/25 border border-[#9D00FF]/60 text-xs font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tagsList.map((tg) => (
                    <span
                      key={tg}
                      className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-purple-100 flex items-center gap-1.5"
                    >
                      <span>{tg}</span>
                      <button
                        type="button"
                        aria-label={`Remove tag ${tg}`}
                        onClick={() => setTagsList((prev) => prev.filter((t) => t !== tg))}
                        className="hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <span className="text-xs font-bold text-purple-100">Who can watch this post</span>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as PostVisibility)}
                  aria-label="Post visibility"
                  className="h-9 px-3 rounded-xl bg-[#090514] border border-white/15 text-xs font-semibold"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="Friends">Friends</option>
                  <option value="Followers">Followers</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>

            {safetyScanState.blocked && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{safetyScanState.verdict}</span>
              </div>
            )}

            {/* Final Publish CTAs */}
            <div className="flex items-center justify-between gap-3 pt-2 pb-6">
              <button
                type="button"
                onClick={() => setStage('editor')}
                className="px-4 h-11 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
              >
                ← Back to Editor
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePublish(true)}
                  className="px-4 h-11 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={safetyScanState.scanning}
                  onClick={() => handlePublish(false)}
                  className="px-6 h-11 rounded-full bg-gradient-to-r from-[#FF0080] to-[#9D00FF] text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#FF0080]/35 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {safetyScanState.scanning
                      ? 'Scanning AI Safety...'
                      : selectedOption === 'story'
                      ? 'Post Story (48h)'
                      : selectedOption === 'photo'
                      ? 'Post Photo'
                      : 'Post / Upload Video'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
