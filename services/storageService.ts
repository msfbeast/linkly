import { LinkData, ClickEvent, BioProfile } from '../types';

const STORAGE_KEY = 'gather_db_v2';
const BIO_STORAGE_KEY = 'gather_bios_v1';

// --- LINKS ---

export const getLinks = (): LinkData[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLink = (link: LinkData): void => {
  const links = getLinks();
  const updatedLinks = [link, ...links];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLinks));
};

export const saveLinksBulk = (newLinks: LinkData[]): void => {
  const links = getLinks();
  const updatedLinks = [...newLinks, ...links];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLinks));
};

export const updateLink = (id: string, updates: Partial<LinkData>): void => {
  const links = getLinks();
  const index = links.findIndex(l => l.id === id);
  if (index !== -1) {
    links[index] = { ...links[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }
};

export const deleteLink = (id: string): void => {
  const links = getLinks();
  const filtered = links.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getLinkByCode = (code: string): LinkData | undefined => {
  const links = getLinks();
  return links.find(l => l.shortCode === code);
};

// --- BIO PROFILES ---

export const getBioProfiles = (): BioProfile[] => {
  const data = localStorage.getItem(BIO_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBioProfile = (profile: BioProfile): void => {
  const profiles = getBioProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index !== -1) {
    profiles[index] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(BIO_STORAGE_KEY, JSON.stringify(profiles));
};

export const getBioProfileByHandle = (handle: string): BioProfile | undefined => {
  const profiles = getBioProfiles();
  return profiles.find(p => p.handle === handle);
};

export const deleteBioProfile = (id: string): void => {
  const profiles = getBioProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  localStorage.setItem(BIO_STORAGE_KEY, JSON.stringify(filtered));
};

// --- ANALYTICS ---

const getDeviceAndOS = (ua: string) => {
  let os: ClickEvent['os'] = 'unknown';
  let device: ClickEvent['device'] = 'desktop';

  if (/android/i.test(ua)) {
    os = 'android';
    device = 'mobile';
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'ios';
    device = /iPad/.test(ua) ? 'tablet' : 'mobile';
  } else if (/Win/.test(ua)) {
    os = 'windows';
  } else if (/Mac/.test(ua)) {
    os = 'macos';
  } else if (/Linux/.test(ua)) {
    os = 'linux';
  }

  if (/Mobile/.test(ua)) device = 'mobile';

  return { os, device };
};

export const incrementClicks = (id: string): void => {
  const links = getLinks();
  const index = links.findIndex(l => l.id === id);
  if (index !== -1) {
    const ua = navigator.userAgent;
    const { os, device } = getDeviceAndOS(ua);

    // Simple heuristic for country from locale (e.g. en-US -> US)
    // In a real app, this would be done via IP geolocation server-side
    const locale = navigator.language || 'en-US';
    const country = locale.split('-')[1] || 'Unknown';

    const event: ClickEvent = {
      timestamp: Date.now(),
      referrer: document.referrer || 'Direct',
      device,
      os,
      country
    };

    links[index].clicks += 1;
    links[index].lastClickedAt = Date.now();
    if (!links[index].clickHistory) links[index].clickHistory = [];
    links[index].clickHistory.push(event);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }
};