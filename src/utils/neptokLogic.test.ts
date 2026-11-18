import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GIFTS_48,
  COIN_PACKAGES,
  CAMERA_EFFECTS_60,
  POST_FILTERS_80,
  coinsToUsd,
  usdToCoins,
  calculatePackageTotalCoins,
  formatUsd,
  evaluateMonetizationEligibility,
  calculateCreatorContentEarningsUsd,
  calculateCreatorGiftPayoutUsd,
  filterVisiblePosts,
  isStoryActive,
  getStoryRemainingHours,
  splitAndDeleteMiddleSegment,
  runRuleBasedSafetyPrecheck,
  STORY_DURATION_MS,
  formatLiveDuration,
  getLiveGridLayout,
  splitTimelineClipAtTime,
  calculateClipsTotalDuration,
  calculateAspectCropRect,
  POST_STICKERS_120,
} from './neptokLogic';

test('Gift collection preserves exact 48 original gifts from Double Rose (1) to Sagarmatha (1,000)', () => {
  assert.equal(GIFTS_48.length, 48);
  assert.equal(GIFTS_48[0].name, 'Double Rose');
  assert.equal(GIFTS_48[0].coins, 1);
  assert.equal(GIFTS_48[47].name, 'Sagarmatha');
  assert.equal(GIFTS_48[47].coins, 1000);
});

test('Currency math enforces USD ($) and NepTok Coins (N) conversion strictly', () => {
  assert.equal(coinsToUsd(12500), 125.0);
  assert.equal(usdToCoins(256.8), 25680);
  assert.equal(formatUsd(350), '$350.00');
  const vipPkg = COIN_PACKAGES.find((p) => p.coins === 10000);
  assert.ok(vipPkg);
  assert.equal(vipPkg.priceUsd, 100);
  assert.equal(vipPkg.bonusPct, 20);
  assert.equal(calculatePackageTotalCoins(vipPkg), 12000);
});

test('Camera effects (60+) and post-production filters (80+) meet capacity requirements', () => {
  assert.ok(CAMERA_EFFECTS_60.length >= 60);
  assert.ok(POST_FILTERS_80.length >= 80);
});

test('Creator monetization enforces strict 5,000 follower threshold', () => {
  const ineligible = evaluateMonetizationEligibility(4999, true);
  assert.equal(ineligible.eligible, false);
  assert.equal(ineligible.remainingFollowers, 1);

  const eligible = evaluateMonetizationEligibility(5000, true);
  assert.equal(eligible.eligible, true);
  assert.equal(eligible.remainingFollowers, 0);
  assert.equal(eligible.progressPct, 100);

  const badStanding = evaluateMonetizationEligibility(12000, false);
  assert.equal(badStanding.eligible, false);

  assert.ok(calculateCreatorContentEarningsUsd(100000, 8) > 100);
  assert.equal(calculateCreatorGiftPayoutUsd(10000, 0.7), 70);
});

test('Post visibility and user block rules filter Everyone, Friends, Followers, and Private correctly', () => {
  const posts = [
    { id: 'p1', authorId: 'u_public', visibility: 'Everyone' as const },
    { id: 'p2', authorId: 'u_friend', visibility: 'Friends' as const },
    { id: 'p3', authorId: 'u_follow', visibility: 'Followers' as const },
    { id: 'p4', authorId: 'u_stranger', visibility: 'Friends' as const },
    { id: 'p5', authorId: 'u_private', visibility: 'Private' as const },
    { id: 'p6', authorId: 'me', visibility: 'Private' as const },
    { id: 'p7', authorId: 'u_blocked', visibility: 'Everyone' as const },
  ];

  const visible = filterVisiblePosts(
    posts,
    'me',
    ['u_blocked'],
    ['u_follow'],
    ['u_friend']
  ).map((p) => p.id);

  assert.deepEqual(visible, ['p1', 'p2', 'p3', 'p6']);
});

test('Stories remain active for 48 hours and expire after 48 hours', () => {
  const now = 1_700_000_000_000;
  assert.equal(isStoryActive(now - 25 * 3600 * 1000, now), true);
  assert.equal(getStoryRemainingHours(now - 24 * 3600 * 1000, now), 24);
  assert.equal(isStoryActive(now - STORY_DURATION_MS - 1, now), false);
});

test('Multi-track timeline split and delete middle segment ripples remaining segments', () => {
  const result = splitAndDeleteMiddleSegment(45, 5, 40, 15, 25);
  assert.deepEqual(result.segments, [
    { start: 5, end: 15 },
    { start: 25, end: 40 },
  ]);
  assert.equal(result.outputDuration, 25);
});

test('AI censorship & copyright safety precheck flags NSFW, violence, and copyright violations', () => {
  assert.equal(runRuleBasedSafetyPrecheck({ caption: 'Sunrise in Pokhara' }).status, 'APPROVED');
  assert.equal(runRuleBasedSafetyPrecheck({ simulateFlag: 'nsfw' }).status, 'BLOCKED');
  assert.equal(runRuleBasedSafetyPrecheck({ simulateFlag: 'violence' }).status, 'BLOCKED');
  const cp = runRuleBasedSafetyPrecheck({ simulateFlag: 'copyright' });
  assert.equal(cp.status, 'FLAGGED');
  assert.equal(cp.copyrightStatus, 'MUTED_SEGMENT');
});

test('Live dynamic layout scales from Full Screen (1 host) to Split Screen (2) and up to 8-user grid', () => {
  const single = getLiveGridLayout(1);
  assert.equal(single.isSingleHostFullScreen, true);
  assert.equal(single.isSplitScreen, false);
  assert.equal(single.colsClass, 'grid-cols-1');

  const split = getLiveGridLayout(2);
  assert.equal(split.isSingleHostFullScreen, false);
  assert.equal(split.isSplitScreen, true);
  assert.equal(split.colsClass, 'grid-cols-2');

  const eightPlus = getLiveGridLayout(12);
  assert.equal(eightPlus.cappedCount, 8);
  assert.equal(eightPlus.colsClass, 'grid-cols-2 sm:grid-cols-4');

  assert.equal(formatLiveDuration(920), '00:15:20');
});

test('CapCut-style multi-clip split splits selected video clip at playhead cleanly', () => {
  const clips = [{ id: 'c1', label: 'Main Clip', start: 0, end: 30 }];
  const split = splitTimelineClipAtTime(clips, 'c1', 12);
  assert.equal(split.length, 2);
  assert.equal(split[0].start, 0);
  assert.equal(split[0].end, 12);
  assert.equal(split[1].start, 12);
  assert.equal(split[1].end, 30);
  assert.equal(calculateClipsTotalDuration(split), 30);
});

test('Edit Profile aspect-ratio crop math enforces 3:1 cover and 1:1 avatar framing', () => {
  const coverRect = calculateAspectCropRect(1920, 1080, 3, 1, 0, 0);
  assert.equal(coverRect.sw, 1920);
  assert.equal(coverRect.sh, 640);
  assert.equal(coverRect.sy, 220);

  const avatarZoomed = calculateAspectCropRect(1000, 1000, 1, 2, 1, -1);
  assert.equal(avatarZoomed.sw, 500);
  assert.equal(avatarZoomed.sh, 500);
  assert.equal(avatarZoomed.sx, 500);
  assert.equal(avatarZoomed.sy, 0);
});

test('Live 6-user grid divides into balanced video boxes and sticker library has 100-150 stickers', () => {
  const six = getLiveGridLayout(6);
  assert.equal(six.cappedCount, 6);
  assert.equal(six.colsClass, 'grid-cols-2 sm:grid-cols-3');
  assert.equal(six.isSingleHostFullScreen, false);
  assert.equal(six.isSplitScreen, false);

  assert.ok(POST_STICKERS_120.length >= 100 && POST_STICKERS_120.length <= 150);
  const uniqueIds = new Set(POST_STICKERS_120.map((s) => s.id));
  assert.equal(uniqueIds.size, POST_STICKERS_120.length);
  assert.ok(POST_STICKERS_120.every((s) => s.symbol.length > 0 && s.label.length > 0));
});

import {
  clampLiveGoalValue,
  duplicateTimelineClip,
  slipTimelineClip,
  generateBeatMarkers,
  trimOrExtendTimelineClip,
  moveTimelineClip,
  BEAUTY_EFFECTS_25,
  updateBattleStreak,
} from './neptokLogic';

test('LIVE Goal value clamps cleanly between 50 and 10,000', () => {
  assert.equal(clampLiveGoalValue(10), 50);
  assert.equal(clampLiveGoalValue(300), 300);
  assert.equal(clampLiveGoalValue(12500), 10000);
  assert.equal(clampLiveGoalValue(Number.NaN), 50);
});

test('Timeline duplicate, slip, and beat marker helpers operate deterministically', () => {
  const base = [{ id: 'c1', label: 'Clip 1', start: 0, end: 10 }];
  const dup = duplicateTimelineClip(base, 'c1', '99');
  assert.equal(dup.length, 2);
  assert.equal(dup[1].start, 10);
  assert.equal(dup[1].end, 20);

  const slipped = slipTimelineClip(base, 'c1', 5, 30);
  assert.equal(slipped[0].start, 5);
  assert.equal(slipped[0].end, 15);

  const clampedSlip = slipTimelineClip(base, 'c1', 50, 20);
  assert.equal(clampedSlip[0].start, 10);
  assert.equal(clampedSlip[0].end, 20);

  const beats = generateBeatMarkers(6, 120);
  assert.ok(beats.length >= 10);
  assert.equal(beats[0], 0.5);
});

test('Beauty Camera provides 20 to 25 distinct working effects and Battle Streak updates properly', () => {
  assert.ok(BEAUTY_EFFECTS_25.length >= 20 && BEAUTY_EFFECTS_25.length <= 25);
  const names = new Set(BEAUTY_EFFECTS_25.map((e) => e.name));
  assert.equal(names.size, BEAUTY_EFFECTS_25.length);
  assert.ok(BEAUTY_EFFECTS_25.every((e) => e.cssFilter.length > 0));

  assert.equal(updateBattleStreak(2, true), 3);
  assert.equal(updateBattleStreak(0, true), 1);
  assert.equal(updateBattleStreak(4, false), 0);
});

test('Timeline trim/extend, move, and spanning-clip split operate cleanly on video and audio segments', () => {
  const base = [
    { id: 'c1', label: 'Clip 1', start: 2, end: 12 },
    { id: 'c2', label: 'Clip 2', start: 12, end: 25 },
  ];

  // Shrink start & extend end beyond initial duration
  const trimmed = trimOrExtendTimelineClip(base, 'c1', 'start', 3);
  assert.equal(trimmed[0].start, 5);
  assert.equal(trimmed[0].end, 12);

  const extended = trimOrExtendTimelineClip(trimmed, 'c2', 'end', 25, 1, 180);
  assert.equal(extended[1].end, 50);

  // Move clip forward/backward preserving duration
  const moved = moveTimelineClip(base, 'c1', 6, 45);
  assert.equal(moved[0].start, 8);
  assert.equal(moved[0].end, 18);

  // Split spanning clip even if selectedClipId was c1 while playhead is inside c2
  const splitSpan = splitTimelineClipAtTime(base, 'c1', 18);
  assert.equal(splitSpan.length, 3);
  assert.equal(splitSpan[1].start, 12);
  assert.equal(splitSpan[1].end, 18);
  assert.equal(splitSpan[2].start, 18);
  assert.equal(splitSpan[2].end, 25);
});

import {
  canStartLiveBattle,
  recordParticipantGiftAndRank,
  createBattleMultiplierChallenge,
  advanceMultiplierChallenge,
  applyBattleGiftWithMultiplier,
  clampPlaybackSpeed,
  PLAYBACK_SPEED_OPTIONS,
} from './neptokLogic';

test('Battle eligibility allows ONLY 2 or 4 participants (disables 1, 3, 5..8)', () => {
  assert.equal(canStartLiveBattle(1), false);
  assert.equal(canStartLiveBattle(2), true);
  assert.equal(canStartLiveBattle(3), false);
  assert.equal(canStartLiveBattle(4), true);
  assert.equal(canStartLiveBattle(6), false);
  assert.equal(canStartLiveBattle(8), false);
});

test('Top Gifter & Co-Gifter rank system re-ranks participants in real time by gifted coins', () => {
  const initial = [
    { id: 'u1', name: 'Sita', handle: 'sita_kathmandu', img: '/a.jpg', coins: 500 },
    { id: 'u2', name: 'Binod', handle: 'everest_binod', img: '/b.jpg', coins: 300 },
    { id: 'u3', name: 'Maya', handle: 'pokhara_maya', img: '/c.jpg', coins: 200 },
    { id: 'u4', name: 'Kiran', handle: 'kiran_dharan', img: '/d.jpg', coins: 100 },
    { id: 'u5', name: 'Rohan', handle: 'rohan_beats', img: '/e.jpg', coins: 50 },
  ];

  // Rohan sends 600 N -> jumps straight to #1
  const ranked = recordParticipantGiftAndRank(
    initial,
    { id: 'u5', name: 'Rohan', handle: 'rohan_beats', img: '/e.jpg' },
    600
  );
  assert.equal(ranked[0].handle, 'rohan_beats');
  assert.equal(ranked[0].coins, 650);
  assert.equal(ranked[1].handle, 'sita_kathmandu');
});

test('2x / 3x / 4x battle multiplier challenge unlocks and multiplies incoming gift points', () => {
  const c2 = createBattleMultiplierChallenge(2);
  const progressed = advanceMultiplierChallenge(c2, 'Double Rose', 25);
  assert.equal(progressed.unlocked, false);
  const completed = advanceMultiplierChallenge(progressed, 'Momo Plate', 30);
  assert.equal(completed.unlocked, true);
  assert.equal(applyBattleGiftWithMultiplier(100, 3), 300);
  assert.equal(applyBattleGiftWithMultiplier(100, 4), 400);
});

test('Post-production speed clamping and speed options remain valid', () => {
  assert.deepEqual([...PLAYBACK_SPEED_OPTIONS], [0.25, 0.5, 1, 1.5, 2, 3]);
  assert.equal(clampPlaybackSpeed(0.1), 0.25);
  assert.equal(clampPlaybackSpeed(1.5), 1.5);
  assert.equal(clampPlaybackSpeed(5), 3);
  assert.equal(clampPlaybackSpeed(Number.NaN), 1);
});
import {
  processRapidGiftTap,
  filterProfilePostsByTab,
} from './neptokLogic';

test('Continuous rapid gift taps deduct sequentially and halt cleanly on insufficient coins', () => {
  let coins = 50;
  let sentCount = 0;
  for (let i = 0; i < 60; i++) {
    const res = processRapidGiftTap(coins, 1);
    if (!res.ok) {
      assert.equal(res.reason, 'Insufficient Coins / Recharge');
      break;
    }
    coins = res.remainingCoins;
    sentCount += 1;
  }
  assert.equal(sentCount, 50);
  assert.equal(coins, 0);

  const blocked = processRapidGiftTap(99, 100);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.remainingCoins, 99);
});

test('Profile tabs filter Liked videos and enforce owner-only Drafts privacy', () => {
  const samplePosts = [
    { id: 'p1', authorId: 'u_me', type: 'video' as const, visibility: 'Everyone' as const, savedByMe: false, likedByMe: true, isDraft: false },
    { id: 'p2', authorId: 'u_sita', type: 'reel' as const, visibility: 'Everyone' as const, savedByMe: true, likedByMe: true, isDraft: false },
    { id: 'd1', authorId: 'u_me', type: 'video' as const, visibility: 'Everyone' as const, savedByMe: false, likedByMe: false, isDraft: true },
    { id: 'd2', authorId: 'u_sita', type: 'video' as const, visibility: 'Everyone' as const, savedByMe: false, likedByMe: false, isDraft: true },
  ];

  // Owner sees only their own drafts in Drafts tab
  const ownerDrafts = filterProfilePostsByTab(samplePosts, 'u_me', 'Drafts', true);
  assert.deepEqual(ownerDrafts.map((p) => p.id), ['d1']);

  // Non-owner visitors cannot see any drafts
  const visitorDrafts = filterProfilePostsByTab(samplePosts, 'u_me', 'Drafts', false);
  assert.deepEqual(visitorDrafts, []);

  // Drafts never leak into Grid or Liked tabs
  const grid = filterProfilePostsByTab(samplePosts, 'u_me', 'Grid', true);
  assert.equal(grid.some((p) => p.isDraft), false);

  const liked = filterProfilePostsByTab(samplePosts, 'u_me', 'Liked', true);
  assert.deepEqual(liked.map((p) => p.id), ['p1', 'p2']);
});
