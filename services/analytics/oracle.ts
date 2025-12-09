import { LinkData, ClickEvent } from '../../types';

export interface AudiencePersona {
  id: string;
  name: string;
  emoji: string;
  description: string;
  matchScore: number; // 0-100%
  traits: string[];
  color: string;
}

export interface EngagementVelocity {
  currentCpm: number; // Clicks per minute (last hour avg)
  historicalAvgCpm: number; // 30-day average
  trend: 'exploding' | 'rising' | 'stable' | 'cooling' | 'cold';
  multiplier: number; // e.g., 5.2x normal
}

export interface CreatorRank {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  score: number; // 0-1000
  percentile: number; // Top X%
  badges: string[]; // ["Viral", "Consistent", "Early Adopter"]
  nextMilestone: string;
  progressToNext: number; // 0-100%
}

// ------------------------------------------------------------------
// PERSONA GENERATION ENGINE
// ------------------------------------------------------------------

export function generatePersonas(links: LinkData[]): AudiencePersona[] {
  const allClicks = links.flatMap(l => l.clickHistory || []);
  if (allClicks.length === 0) return [];

  // 1. Analyze Time of Day
  const hourCounts: Record<number, number> = {};
  allClicks.forEach(c => {
    const hour = new Date(c.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  // 2. Analyze Device
  const deviceCounts: Record<string, number> = {};
  allClicks.forEach(c => {
    const dev = c.device || 'unknown';
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
  });

  const total = allClicks.length;

  // Define Archetypes
  const personas: AudiencePersona[] = [];

  // Archetype: The Night Owl
  const nightClicks = (hourCounts[23] || 0) + (hourCounts[0] || 0) + (hourCounts[1] || 0) + (hourCounts[2] || 0) + (hourCounts[3] || 0) + (hourCounts[4] || 0);
  if (nightClicks / total > 0.2) {
    personas.push({
      id: 'night_owl',
      name: 'The Night Owl',
      emoji: '🦉',
      description: 'Browses while the world sleeps. Likely deep in focus mode.',
      matchScore: Math.round((nightClicks / total) * 100),
      traits: ['Late Night', 'Focused', 'Mobile Heavy'],
      color: 'indigo'
    });
  }

  // Archetype: The Lunch Breaker
  const lunchClicks = (hourCounts[11] || 0) + (hourCounts[12] || 0) + (hourCounts[13] || 0) + (hourCounts[14] || 0);
  if (lunchClicks / total > 0.25) {
    personas.push({
      id: 'lunch_breaker',
      name: 'The Lunch Breaker',
      emoji: '🥪',
      description: 'Checks in during pauses. Needs quick, bite-sized info.',
      matchScore: Math.round((lunchClicks / total) * 100),
      traits: ['Mid-Day', 'Quick Scan', 'Mobile'],
      color: 'orange'
    });
  }

  // Archetype: The Desktop Pro
  const desktopClicks = deviceCounts['desktop'] || 0;
  if (desktopClicks / total > 0.4) {
    personas.push({
      id: 'desktop_pro',
      name: 'The Desktop Pro',
      emoji: '💻',
      description: 'Browsing from a workstation. Professional intent.',
      matchScore: Math.round((desktopClicks / total) * 100),
      traits: ['Big Screen', 'Professional', 'High Attention'],
      color: 'blue'
    });
  }

  // Archetype: The Social Glider
  const socialReferrers = allClicks.filter(c => ['t.co', 'twitter', 'instagram', 'facebook', 'linkedin'].some(s => c.referrer.includes(s))).length;
  if (socialReferrers / total > 0.5) {
    personas.push({
      id: 'social_glider',
      name: 'The Social Glider',
      emoji: '🦋',
      description: 'Flying in from social feeds. Visual appetite.',
      matchScore: Math.round((socialReferrers / total) * 100),
      traits: ['Social Media', 'Visual', 'Fast'],
      color: 'pink'
    });
  }

  return personas.sort((a, b) => b.matchScore - a.matchScore).slice(0, 2);
}

// ------------------------------------------------------------------
// ENGAGEMENT VELOCITY ENGINE
// ------------------------------------------------------------------

export function calculateVelocity(links: LinkData[]): EngagementVelocity {
  const allClicks = links.flatMap(l => l.clickHistory || []);
  if (allClicks.length === 0) {
    return { currentCpm: 0, historicalAvgCpm: 0, trend: 'cold', multiplier: 0 };
  }

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const recentClicks = allClicks.filter(c => c.timestamp > oneHourAgo).length;
  const currentCpm = recentClicks / 60;

  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const historicalClicks = allClicks.filter(c => c.timestamp > thirtyDaysAgo && c.timestamp < oneHourAgo).length;

  const daysObserved = Math.max(1, (oneHourAgo - thirtyDaysAgo) / (24 * 60 * 60 * 1000));
  const historicalAvgCpm = (historicalClicks / daysObserved) / 24 / 60;

  const safeBase = historicalAvgCpm === 0 ? 0.001 : historicalAvgCpm;
  const multiplier = currentCpm / safeBase;

  let trend: EngagementVelocity['trend'] = 'stable';
  if (currentCpm === 0) trend = 'cold';
  else if (multiplier > 5) trend = 'exploding';
  else if (multiplier > 2) trend = 'rising';
  else if (multiplier < 0.5) trend = 'cooling';

  return {
    currentCpm: parseFloat(currentCpm.toFixed(4)),
    historicalAvgCpm: parseFloat(historicalAvgCpm.toFixed(4)),
    trend,
    multiplier: parseFloat(multiplier.toFixed(1))
  };
}

// ------------------------------------------------------------------
// RANK & GAMIFICATION ENGINE
// ------------------------------------------------------------------

export function calculateCreatorRank(links: LinkData[]): CreatorRank {
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalLinks = links.length;

  // Simple Score: Clicks + (Links * 10)
  let score = totalClicks + (totalLinks * 10);

  // Levels
  let level: CreatorRank['level'] = 'Bronze';
  let percentile = 90;
  let nextMilestone = '100 Score';
  let progressToNext = 0;

  if (score > 10000) {
    level = 'Diamond';
    percentile = 0.1;
    nextMilestone = 'Influencer';
    progressToNext = 100;
  } else if (score > 5000) {
    level = 'Platinum';
    percentile = 1;
    nextMilestone = 'Diamond (10k)';
    progressToNext = ((score - 5000) / 5000) * 100;
  } else if (score > 1000) {
    level = 'Gold';
    percentile = 5;
    nextMilestone = 'Platinum (5k)';
    progressToNext = ((score - 1000) / 4000) * 100;
  } else if (score > 200) {
    level = 'Silver';
    percentile = 20;
    nextMilestone = 'Gold (1k)';
    progressToNext = ((score - 200) / 800) * 100;
  } else {
    level = 'Bronze';
    percentile = 50;
    nextMilestone = 'Silver (200)';
    progressToNext = (score / 200) * 100;
  }

  const badges: string[] = [];
  if (totalClicks > 0) badges.push('First Click');
  if (score > 1000) badges.push('Club 1K');

  // Check for velocity badge
  const v = calculateVelocity(links);
  if (v.trend === 'exploding') badges.push('Viral Now');

  return {
    level,
    score,
    percentile,
    badges,
    nextMilestone,
    progressToNext: Math.min(100, Math.round(progressToNext))
  };
}
