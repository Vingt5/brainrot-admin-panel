import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

import { type Brainrot, type Rarity, type SourceStatus } from '../core/types.js';
import { resolveProjectPath } from '../utils/assets.js';

interface BrainrotAssetManifestEntry {
  slug: string;
  targetPath: string;
  sourcePageUrl: string;
  sourceImageUrl: string;
}

interface IoEntry {
  slug: string;
  name: string;
  imageUrl: string;
  description: string;
}

interface LolEntry {
  slug: string;
  name: string;
  imageUrl: string;
  description: string;
  aliases: string[];
  popularity: number;
}

interface WikiEntry {
  title: string;
  pageUrl: string;
  imageUrl: string | null;
  description: string | null;
}

interface CandidateDefinition {
  name: string;
  sourceGroup: 'official' | 'famous' | 'encyclopedia' | 'manual';
  ioNameOverride?: string;
  lolNameOverride?: string;
  wikiTitleOverride?: string;
  wikiSearchHint?: string;
}

interface CandidateSourceContext {
  existing?: Brainrot;
  ioEntry?: IoEntry;
  lolEntry?: LolEntry;
  wikiEntry?: WikiEntry | null;
}

const MEDIAWIKI_API_URL =
  'https://italianbrainrot.miraheze.org/w/api.php?format=json&origin=*';

const officialTopAdditions: CandidateDefinition[] = [
  { name: 'Turpialero Turpialá', sourceGroup: 'official' },
  { name: 'Crocodillo Ananasino Bombardetto Ananasetto', sourceGroup: 'official' },
  { name: 'Flamino Scutetti', sourceGroup: 'official' },
  { name: 'Jelephant', sourceGroup: 'official' },
  { name: 'Fritto Peppino Supremo', sourceGroup: 'official' },
  { name: 'Ganganzelli Trulala', sourceGroup: 'official' },
  { name: 'Avocadini Guffo', sourceGroup: 'official' },
  { name: 'Graipussi Medussi', sourceGroup: 'official' },
  { name: 'Dragonfrutini Monkeyuchi', sourceGroup: 'official' },
  { name: 'Tantrum Rum Takum Fum Sahum', sourceGroup: 'official' },
  { name: 'Nug Nug Nug Sahur', sourceGroup: 'official' },
  { name: 'Pinguinucha de la Eterna Lucha', sourceGroup: 'official' },
  { name: 'Brim Brim Brim Brum', sourceGroup: 'official' },
  { name: 'Yo Tengo un Tirititango', sourceGroup: 'official' },
  {
    name: 'Ta Ta Ta Ta Ta Ta Ta Sahur',
    sourceGroup: 'official',
    ioNameOverride: 'Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Sahur'
  },
  { name: 'Camelo Cruasantino', sourceGroup: 'official' },
  { name: 'Burger', sourceGroup: 'official' },
  { name: 'Teks Teks Teks Koreteks', sourceGroup: 'official' },
  {
    name: 'Tus Tus Tus Tus Tus Cactus',
    sourceGroup: 'official',
    wikiTitleOverride: 'Tus Tus Tus Tus Tus Tus Cactus'
  },
  { name: 'Nooo My Hotspot', sourceGroup: 'official' },
  { name: 'Coccodrilli Faerini', sourceGroup: 'official' },
  { name: 'Mattiaaaaaaaassss', sourceGroup: 'official' },
  { name: 'Nukum Kaixana', sourceGroup: 'official' },
  { name: 'Inilah sosok orang yang selalu ngomong', sourceGroup: 'official' },
  { name: 'Hukkin-Bakibaki Amasa-Ni-Muteki Chocolate', sourceGroup: 'official' },
  {
    name: 'Duk Duk Duk Beraduk Sapi Uduk',
    sourceGroup: 'official',
    wikiTitleOverride: 'Beduk Duk Duk Beraduk Sapi Uduk'
  },
  { name: 'Gangster Footera', sourceGroup: 'official' },
  { name: 'Mecratto Vortole', sourceGroup: 'official' },
  { name: 'Rarabougri Kiki Pipi', sourceGroup: 'official' },
  { name: 'Bum Bum Dragolo', sourceGroup: 'official' },
  { name: 'Buffalo Cactusuffalo', sourceGroup: 'official' },
  { name: 'Greng Greng Greng Greng Greng Bus Ireng', sourceGroup: 'official' },
  { name: 'Gorgonzilla', sourceGroup: 'official' },
  { name: 'Motor Sahur', sourceGroup: 'official' },
  { name: 'El Porquito Mechicanito', sourceGroup: 'official' },
  { name: 'Ren Guo Ping De Pa', sourceGroup: 'official' },
  { name: 'Bambini Felicini', sourceGroup: 'official' },
  { name: 'Bomberino Foxerino', sourceGroup: 'official' },
  {
    name: 'Flamingo Salpino Girino',
    sourceGroup: 'official',
    wikiTitleOverride: 'IIIIUIIUIIUIIUIIUIUIUIUIUIUIU Flamingo Salpino Girino'
  },
  { name: 'Chimpanzini Chimpanzi', sourceGroup: 'official' },
  { name: 'Hippobardos Bombardone', sourceGroup: 'official' },
  { name: 'Burgerini Bearini', sourceGroup: 'official' },
  { name: 'Bau Bau Wang Wang Wolf Wolf Monarca', sourceGroup: 'official' },
  { name: 'Tai Tai Tai Tai Tai Tai TaiChi Lulujibadaodaoguanmastero', sourceGroup: 'official' },
  { name: 'Brr Brr Gangster Gusini', sourceGroup: 'official' }
];

const famousAdditions: CandidateDefinition[] = [
  { name: 'Apipipipi', sourceGroup: 'famous' },
  { name: 'Bobrini Cococosini', sourceGroup: 'famous' },
  { name: 'Bri Bri Bicus Dicus De Bicus De Dicus', sourceGroup: 'famous' },
  { name: 'Bunny Mailo Zippito Caro', sourceGroup: 'famous' },
  { name: 'Burbaloni Lulliloli', sourceGroup: 'famous' },
  { name: 'Frulli Frulla', sourceGroup: 'famous' },
  { name: 'Garamararambraramanmararaman Dan Madudungdung Tak Tuntung Perkuntung', sourceGroup: 'famous' },
  { name: 'Giraffa Celeste', sourceGroup: 'famous' },
  { name: 'Il Cacto Hipopotamo', sourceGroup: 'famous' },
  { name: 'Noo La Polizia', sourceGroup: 'famous' },
  { name: 'Pot Hotspot', sourceGroup: 'famous' },
  { name: 'Sigma Boy', sourceGroup: 'famous' },
  { name: 'Ta Ta Ta Sahur', sourceGroup: 'famous' },
  { name: 'Zebrossi Fumoso', sourceGroup: 'famous' },
  { name: 'Zmakey Kiwitini', sourceGroup: 'famous' }
];

const encyclopediaAdditions: CandidateDefinition[] = [
  { name: 'Talpa Di Ferro', sourceGroup: 'encyclopedia' },
  { name: 'Chef Crabracadabra', sourceGroup: 'encyclopedia' },
  { name: 'Espressona Signora', sourceGroup: 'encyclopedia' },
  { name: 'Tigrrullini Watermellini', sourceGroup: 'encyclopedia' },
  { name: 'Trulimero Trulicina', sourceGroup: 'encyclopedia' },
  { name: 'U Din Din Din Din Dun Ma Din Din Din Dun', sourceGroup: 'encyclopedia' }
];

const manualAdditions: CandidateDefinition[] = [
  { name: 'Ballerino Lololo', sourceGroup: 'manual' },
  { name: 'Brr Es Teh Patipum', sourceGroup: 'manual' },
  { name: 'Bulbito Bandito Traktorito', sourceGroup: 'manual' },
  { name: 'Ecco Cavallo Virtuoso', sourceGroup: 'manual' },
  { name: 'Leonelli Cactuselli', sourceGroup: 'manual' },
  { name: 'Piccione Macchina', sourceGroup: 'manual' },
  { name: 'Spaghetti Tualetti', sourceGroup: 'manual' },
  { name: 'Tob Tobi Tob Tob Tobi Tob', sourceGroup: 'manual' }
];

const officialTop50Names = [
  'Turpialero Turpialá',
  'Crocodillo Ananasino Bombardetto Ananasetto',
  'Flamino Scutetti',
  'Jelephant',
  'Fritto Peppino Supremo',
  'Ganganzelli Trulala',
  'Avocadini Guffo',
  'Graipussi Medussi',
  'Dragonfrutini Monkeyuchi',
  'Tantrum Rum Takum Fum Sahum',
  'Nug Nug Nug Sahur',
  'Pinguinucha de la Eterna Lucha',
  'Brim Brim Brim Brum',
  'Yo Tengo un Tirititango',
  'Ta Ta Ta Ta Ta Ta Ta Sahur',
  'Camelo Cruasantino',
  'Burger',
  'Teks Teks Teks Koreteks',
  'Tus Tus Tus Tus Tus Cactus',
  'Nooo My Hotspot',
  'Coccodrilli Faerini',
  'Mattiaaaaaaaassss',
  'Nukum Kaixana',
  'Inilah sosok orang yang selalu ngomong',
  'Hukkin-Bakibaki Amasa-Ni-Muteki Chocolate',
  'Duk Duk Duk Beraduk Sapi Uduk',
  'Gangster Footera',
  'Mecratto Vortole',
  'Rarabougri Kiki Pipi',
  'Bum Bum Dragolo',
  'Boneca Ambalabu',
  'Buffalo Cactusuffalo',
  'Greng Greng Greng Greng Greng Bus Ireng',
  'Gorgonzilla',
  'Motor Sahur',
  'El Porquito Mechicanito',
  'Tralalero Tralala',
  'Ren Guo Ping De Pa',
  'Bambini Felicini',
  'Bomberino Foxerino',
  'Flamingo Salpino Girino',
  'Chimpanzini Chimpanzi',
  'Hippobardos Bombardone',
  'Burgerini Bearini',
  'Bau Bau Wang Wang Wolf Wolf Monarca',
  'Tai Tai Tai Tai Tai Tai TaiChi Lulujibadaodaoguanmastero',
  'Brr Brr Gangster Gusini'
];

const famousNames = [
  'Apipipipi',
  'Ballerina Cappuccina',
  'Blueberrinni Octopussini',
  'Bobrini Cococosini',
  'Bobrito Bandito',
  'Bombardiro Crocodilo',
  'Bombombini Gusini',
  'Boneca Ambalabu',
  'Bri Bri Bicus Dicus De Bicus De Dicus',
  'Brr Brr Patapim',
  'Bunny Mailo Zippito Caro',
  'Burbaloni Lulliloli',
  'Cappuccino Assassino',
  'Chimpanzini Bananini',
  'Cocofanto Elefanto',
  'Frigo Camelo',
  'Frulli Frulla',
  'Garamararambraramanmararaman Dan Madudungdung Tak Tuntung Perkuntung',
  'Giraffa Celeste',
  'Il Cacto Hipopotamo',
  'La Vacca Saturno Saturnita',
  'Lirili Larila',
  'Noo La Polizia',
  'Orangutini Ananasini',
  'Pot Hotspot',
  'Rhino Toasterino',
  'Sigma Boy',
  'Ta Ta Ta Sahur',
  'Tralalero Tralala',
  'Trippi Troppi',
  'Tung Tung Tung Sahur',
  'Zebrossi Fumoso',
  'Zmakey Kiwitini'
];

const preservedExistingSlugs = new Set([
  'cappuccino-assassino',
  'frigo-camelo',
  'chimpanzini-bananini',
  'tric-trac-baraboom',
  'gusino-tractorino',
  'gatille-cafille',
  'matteoo',
  'cocofanto-elefanto',
  'boneca-ambalabu',
  'bombombini-gusini',
  'brr-brr-patapim',
  'patapimus-maximus',
  'trippi-troppi',
  'orangutini-ananasini',
  'perochello-lemonchello',
  'bobrito-bandito',
  'tung-tung-tung-sahur',
  'lirili-larila',
  'la-vacca-saturno-saturnita',
  'blueberrinni-octopussini',
  'rhino-toasterino',
  'bombardiro-crocodilo',
  'ballerina-cappuccina',
  'glorbo-fruttodrillo',
  'zibra-zubra-zibralini',
  'tralalero-tralala'
]);

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolveProjectPath(path), 'utf8')) as T;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/&[^;]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/(.)\1+/g, '$1')
    .replace(/\b(the|la|il|el|un|una|uno|de|di|da|del|della|dello|delle)\b/g, ' ')
    .replace(/capuccino/g, 'cappuccino')
    .replace(/cappucina/g, 'cappuccina')
    .replace(/vaca/g, 'vacca')
    .replace(/girafa/g, 'giraffa')
    .replace(/fruli/g, 'frulli')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&#x27;|&#39;|&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value: string): string {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDescription(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleaned = decodeHtml(value)
    .replace(/\\n/g, ' ')
    .replace(/---/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.length <= 260) {
    return cleaned;
  }

  const sentence = cleaned.match(/^(.{80,240}?[.!?])(?:\s|$)/);

  const firstSentence = sentence?.[1];

  if (firstSentence) {
    return firstSentence.trim();
  }

  return `${cleaned.slice(0, 237).trimEnd()}...`;
}

function isLowQualityDescription(value: string): boolean {
  return (
    /^(redirect to:|overview\b|not to be confused\b|the lyrics is false\b)/i.test(value) ||
    /^popular italian brainrot character:/i.test(value) ||
    value.includes('•') ||
    /^this page/i.test(value) ||
    value.length < 20
  );
}

function buildGenericDescription(name: string): string {
  return `${name} is a well-known Italian Brainrot character documented by the community wiki and meme encyclopedias.`;
}

function pickBestDescription(
  name: string,
  candidates: Array<string | null | undefined>
): string {
  const cleanedCandidates = candidates
    .map((candidate) => cleanDescription(candidate))
    .filter((candidate): candidate is string => Boolean(candidate));

  const bestCandidate = cleanedCandidates.find((candidate) => !isLowQualityDescription(candidate));

  if (bestCandidate) {
    return bestCandidate;
  }

  return buildGenericDescription(name);
}

function getFileExtensionFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const extension = extname(parsedUrl.pathname).toLowerCase();

    if (extension) {
      return extension;
    }
  } catch {
    // Ignore invalid URL parsing. Fallback handled below.
  }

  return '.webp';
}

function getSignificantTokens(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 3 && !['dan', 'tak', 'the'].includes(token));
}

function buildAliases(
  displayName: string,
  slug: string,
  context: CandidateSourceContext
): string[] {
  const aliases = new Set<string>();

  for (const alias of context.existing?.aliases ?? []) {
    aliases.add(alias.trim());
  }

  for (const alias of context.lolEntry?.aliases ?? []) {
    aliases.add(alias.trim());
  }

  if (context.wikiEntry && normalizeText(context.wikiEntry.title) !== normalizeText(displayName)) {
    aliases.add(context.wikiEntry.title);
  }

  const asciiName = normalizeText(displayName);
  const slugAlias = slug.replace(/-/g, ' ');
  const tokens = getSignificantTokens(displayName);

  if (asciiName) {
    aliases.add(asciiName);
  }

  if (slugAlias && slugAlias !== asciiName) {
    aliases.add(slugAlias);
  }

  if (tokens[0]) {
    aliases.add(tokens[0]);
  }

  if (tokens.length >= 2) {
    aliases.add(`${tokens[0]} ${tokens[1]}`);
  }

  return [...aliases]
    .map((alias) => alias.trim())
    .filter((alias) => alias.length >= 3)
    .filter((alias) => normalizeText(alias) !== normalizeText(displayName))
    .filter((alias) => normalizeText(alias) !== normalizeText(slugAlias))
    .slice(0, 6);
}

function buildPopularityScore(
  name: string,
  lolEntriesByName: Map<string, LolEntry>,
  wikiEntry: WikiEntry | null
): number {
  let score = 0;
  const normalizedName = normalizeText(name);
  const officialIndex = officialTop50Names.findIndex(
    (candidate) => normalizeText(candidate) === normalizedName
  );
  const famous = famousNames.some((candidate) => normalizeText(candidate) === normalizedName);
  const lolEntry = lolEntriesByName.get(normalizedName);

  if (officialIndex >= 0) {
    score += 200 - officialIndex;
  }

  if (famous) {
    score += 40;
  }

  if (lolEntry) {
    score += lolEntry.popularity * 6;
  }

  if (wikiEntry) {
    score += 10;
  }

  return score;
}

function getRarityForRank(rank: number): Rarity {
  if (rank < 5) {
    return 'mythic';
  }

  if (rank < 15) {
    return 'legendary';
  }

  if (rank < 30) {
    return 'epic';
  }

  if (rank < 60) {
    return 'rare';
  }

  return 'common';
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Échec du téléchargement : ${url} (${response.status} ${response.statusText})`);
  }

  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Échec du téléchargement : ${url} (${response.status} ${response.statusText})`);
  }

  return response.text();
}

async function parseIoEntries(): Promise<Map<string, IoEntry>> {
  const html = await fetchText('https://italian-brainrot.io/characters/');
  const entries = new Map<string, IoEntry>();
  const matcher =
    /href="\/characters\/([^"\/]+)\/"[\s\S]*?<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g;

  let match: RegExpExecArray | null;

  while ((match = matcher.exec(html)) !== null) {
    const slug = match[1]!;
    const name = stripHtml(match[4]!);

    entries.set(normalizeText(name), {
      slug,
      name,
      imageUrl: decodeHtml(match[3]!),
      description: cleanDescription(stripHtml(match[5]!)) ?? 'Popular Italian Brainrot character.'
    });
  }

  return entries;
}

async function parseLolEntries(): Promise<Map<string, LolEntry>> {
  const html = await fetchText('https://italianbrainrot.lol/characters');
  const entries = new Map<string, LolEntry>();
  const matcher =
    /href="\/characters\/([^"\/]+)"[\s\S]*?<img alt="([^"]+)"[\s\S]*?<h2[^>]*>([^<]+)<\/h2>[\s\S]*?<p[^>]*>Alias:\s*<!-- -->\s*([^<]*)<\/p>[\s\S]*?<p[^>]*class="text-gray-700[^"]*">([^<]+)<\/p>[\s\S]*?Popularity:\s*<!-- -->(\d+)<!-- -->\/10/g;

  let match: RegExpExecArray | null;

  while ((match = matcher.exec(html)) !== null) {
    const slug = match[1]!;
    const name = stripHtml(match[3]!);
    const aliases = decodeHtml(match[4]!)
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean);

    entries.set(normalizeText(name), {
      slug,
      name,
      imageUrl: `https://italianbrainrot.lol/images/characters/${slug}.webp`,
      description: cleanDescription(stripHtml(match[5]!)) ?? 'Popular Italian Brainrot character.',
      aliases,
      popularity: Number(match[6] ?? 0)
    });
  }

  return entries;
}

interface MediaWikiTitleQuery {
  query: {
    pages: Record<
      string,
      {
        title: string;
        missing?: string;
        original?: { source: string };
      }
    >;
  };
}

interface MediaWikiSearchQuery {
  query: {
    search: Array<{ title: string }>;
  };
}

interface MediaWikiParseQuery {
  parse?: {
    text: {
      '*': string;
    };
  };
}

interface MediaWikiAllImagesQuery {
  query?: {
    allimages?: Array<{
      name: string;
    }>;
  };
}

interface MediaWikiImageInfoQuery {
  query: {
    pages: Record<
      string,
      {
        imageinfo?: Array<{ url: string }>;
      }
    >;
  };
}

const wikiSearchCache = new Map<string, WikiEntry | null>();

function buildWikiPageUrl(title: string): string {
  return `https://italianbrainrot.miraheze.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
}

async function getWikiDescription(title: string): Promise<string | null> {
  try {
    const data = await fetchJson<MediaWikiParseQuery>(
      `${MEDIAWIKI_API_URL}&action=parse&page=${encodeURIComponent(title)}&prop=text&section=0`
    );
    const html = data.parse?.text['*'];

    if (!html) {
      return null;
    }

    const paragraphMatcher = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let paragraph: RegExpExecArray | null;

    while ((paragraph = paragraphMatcher.exec(html)) !== null) {
      const text = cleanDescription(stripHtml(paragraph[1]!));

      if (text && !/^this page/i.test(text)) {
        return text;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function getWikiImageUrl(title: string): Promise<string | null> {
  try {
    const data = await fetchJson<MediaWikiParseQuery>(
      `${MEDIAWIKI_API_URL}&action=parse&page=${encodeURIComponent(title)}&prop=text&section=0`
    );
    const html = data.parse?.text['*'];

    if (!html) {
      return null;
    }

    const imageMatch = html.match(/<img[^>]+src="([^"]+)"/i);

    if (!imageMatch?.[1]) {
      return null;
    }

    const imageUrl = decodeHtml(imageMatch[1]);

    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }

    if (imageUrl.startsWith('/')) {
      return `https://italianbrainrot.miraheze.org${imageUrl}`;
    }

    return imageUrl;
  } catch {
    return null;
  }
}

async function getWikiImageUrlFromFiles(candidateName: string): Promise<string | null> {
  const attempts = [
    candidateName,
    candidateName.split(' ').slice(0, 2).join(' '),
    candidateName.split(' ')[0],
    candidateName.split(/[\s-]+/)[0]
  ].filter((value): value is string => Boolean(value));

  const fileNames = new Set<string>();

  for (const attempt of attempts) {
    try {
      const data = await fetchJson<MediaWikiAllImagesQuery>(
        `${MEDIAWIKI_API_URL}&action=query&list=allimages&aifrom=${encodeURIComponent(attempt)}&ailimit=30`
      );

      for (const item of data.query?.allimages ?? []) {
        fileNames.add(item.name);
      }
    } catch {
      // Ignore failures on intermediate fallbacks.
    }
  }

  const normalizedTarget = normalizeText(candidateName);
  const targetTokens = new Set(getSignificantTokens(candidateName));
  const rankedFiles = [...fileNames]
    .map((fileName) => {
      const fileLabel = fileName.replace(/\.[a-z0-9]+$/i, '').replaceAll('_', ' ');
      const normalizedFile = normalizeText(fileLabel);
      const fileTokens = new Set(getSignificantTokens(fileLabel));
      let overlap = 0;

      for (const token of fileTokens) {
        if (targetTokens.has(token)) {
          overlap += 1;
        }
      }

      let score = 0;

      if (normalizedFile === normalizedTarget) {
        score += 100;
      }

      if (normalizedFile.includes(normalizedTarget) || normalizedTarget.includes(normalizedFile)) {
        score += 50;
      }

      const firstToken = normalizedTarget.split(' ')[0];

      if (firstToken && normalizedFile.includes(firstToken)) {
        score += 10;
      }

      score += overlap * 25;

      return { fileName, score };
    })
    .sort((left, right) => right.score - left.score || left.fileName.localeCompare(right.fileName));

  const bestFile = rankedFiles[0]?.fileName;

  if (!bestFile) {
    return null;
  }

  try {
    const data = await fetchJson<MediaWikiImageInfoQuery>(
      `${MEDIAWIKI_API_URL}&action=query&titles=${encodeURIComponent(`File:${bestFile}`)}&prop=imageinfo&iiprop=url`
    );
    const page = Object.values(data.query.pages)[0];
    return page?.imageinfo?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

async function resolveWikiEntry(candidate: CandidateDefinition): Promise<WikiEntry | null> {
  const cacheKey = candidate.wikiTitleOverride ?? candidate.name;

  if (wikiSearchCache.has(cacheKey)) {
    return wikiSearchCache.get(cacheKey) ?? null;
  }

  const attempts = [
    candidate.wikiTitleOverride,
    candidate.name,
    candidate.wikiSearchHint,
    candidate.name.split(' ').slice(0, 2).join(' '),
    candidate.name.split(' ')[0]
  ].filter((value): value is string => Boolean(value));

  const searchTitles = new Set<string>();

  for (const attempt of attempts) {
    const exact = await fetchJson<MediaWikiTitleQuery>(
      `${MEDIAWIKI_API_URL}&action=query&titles=${encodeURIComponent(attempt)}&prop=pageimages&piprop=original`
    );
    const exactPage = Object.values(exact.query.pages)[0];

    if (exactPage && exactPage.missing !== '') {
      searchTitles.add(exactPage.title);
      break;
    }

    const search = await fetchJson<MediaWikiSearchQuery>(
      `${MEDIAWIKI_API_URL}&action=query&list=search&srsearch=${encodeURIComponent(attempt)}&srlimit=10`
    );

    for (const result of search.query.search) {
      searchTitles.add(result.title);
    }
  }

  const targetName = normalizeText(candidate.name);
  const rankedTitles = [...searchTitles]
    .map((title) => {
      const normalizedTitle = normalizeText(title);
      let score = 0;

      if (normalizedTitle === targetName) {
        score += 100;
      }

      if (normalizedTitle.includes(targetName) || targetName.includes(normalizedTitle)) {
        score += 50;
      }

      const firstToken = targetName.split(' ')[0];

      if (firstToken && normalizedTitle.includes(firstToken)) {
        score += 10;
      }

      return { title, score };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  if (rankedTitles.length === 0) {
    wikiSearchCache.set(cacheKey, null);
    return null;
  }

  let bestEntry: WikiEntry | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const rankedTitle of rankedTitles.slice(0, 5)) {
    const details = await fetchJson<MediaWikiTitleQuery>(
      `${MEDIAWIKI_API_URL}&action=query&titles=${encodeURIComponent(rankedTitle.title)}&prop=pageimages&piprop=original`
    );
    const page = Object.values(details.query.pages)[0];
    let imageUrl =
      page?.original?.source ??
      (await getWikiImageUrl(rankedTitle.title)) ??
      (await getWikiImageUrlFromFiles(candidate.name));

    if (imageUrl?.toLowerCase().endsWith('.svg')) {
      imageUrl =
        (await getWikiImageUrlFromFiles(candidate.name)) ??
        (await getWikiImageUrl(rankedTitle.title)) ??
        imageUrl;
    }
    const candidateScore = rankedTitle.score + (imageUrl ? 100 : 0);

    if (
      candidateScore > bestScore ||
      (candidateScore === bestScore && imageUrl && !bestEntry?.imageUrl)
    ) {
      bestScore = candidateScore;
      bestEntry = {
        title: rankedTitle.title,
        pageUrl: buildWikiPageUrl(rankedTitle.title),
        imageUrl,
        description: null
      };
    }
  }

  if (!bestEntry) {
    wikiSearchCache.set(cacheKey, null);
    return null;
  }

  const wikiEntry: WikiEntry = {
    ...bestEntry,
    description: await getWikiDescription(bestEntry.title)
  };

  wikiSearchCache.set(cacheKey, wikiEntry);
  return wikiEntry;
}

async function buildCatalog(): Promise<{
  brainrots: Brainrot[];
  assets: BrainrotAssetManifestEntry[];
}> {
  const existingBrainrots = readJson<Brainrot[]>('data/brainrots.seed.json').filter((brainrot) =>
    preservedExistingSlugs.has(brainrot.slug)
  );
  const existingManifest = readJson<BrainrotAssetManifestEntry[]>('data/brainrot.assets.json').filter((entry) =>
    preservedExistingSlugs.has(entry.slug)
  );
  const existingByName = new Map(existingBrainrots.map((brainrot) => [normalizeText(brainrot.name), brainrot]));
  const existingManifestBySlug = new Map(existingManifest.map((entry) => [entry.slug, entry]));
  const ioEntriesByName = await parseIoEntries();
  const lolEntriesByName = await parseLolEntries();

  const currentDefinitions: CandidateDefinition[] = existingBrainrots.map((brainrot) => ({
    name: brainrot.name,
    sourceGroup: 'manual'
  }));

  const selectedDefinitions = [
    ...currentDefinitions,
    ...officialTopAdditions,
    ...famousAdditions,
    ...encyclopediaAdditions,
    ...manualAdditions
  ];

  const uniqueDefinitions = selectedDefinitions.filter((definition, index, array) => {
    const normalized = normalizeText(definition.name);
    return array.findIndex((candidate) => normalizeText(candidate.name) === normalized) === index;
  });

  if (uniqueDefinitions.length !== 100) {
    throw new Error(`Le catalogue final attendu doit contenir 100 entrées, reçu ${uniqueDefinitions.length}.`);
  }

  const contexts = new Map<string, CandidateSourceContext>();

  for (const definition of uniqueDefinitions) {
    const existing = existingByName.get(normalizeText(definition.name));
    const ioEntry = ioEntriesByName.get(
      normalizeText(definition.ioNameOverride ?? definition.name)
    );
    const lolEntry = lolEntriesByName.get(
      normalizeText(definition.lolNameOverride ?? definition.name)
    );
    const wikiEntry = existing ? null : await resolveWikiEntry(definition);

    contexts.set(normalizeText(definition.name), {
      existing,
      ioEntry,
      lolEntry,
      wikiEntry
    });
  }

  const rarityRanking = [...uniqueDefinitions]
    .map((definition) => {
      const context = contexts.get(normalizeText(definition.name));
      const popularityScore = buildPopularityScore(
        definition.name,
        lolEntriesByName,
        context?.wikiEntry ?? null
      );

      return {
        definition,
        popularityScore
      };
    })
    .sort((left, right) => {
      const scoreDelta = right.popularityScore - left.popularityScore;

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.definition.name.localeCompare(right.definition.name, 'fr-FR');
    });

  const rarityByName = new Map(
    rarityRanking.map((entry, index) => [normalizeText(entry.definition.name), getRarityForRank(index)])
  );

  const brainrots: Brainrot[] = [];
  const assets: BrainrotAssetManifestEntry[] = [];

  for (const definition of uniqueDefinitions) {
    const context = contexts.get(normalizeText(definition.name));

    if (!context) {
      throw new Error(`Contexte introuvable pour ${definition.name}.`);
    }

    const existing = context.existing;

    if (existing) {
      const existingAsset = existingManifestBySlug.get(existing.slug);

      if (!existingAsset) {
        throw new Error(`Asset existant introuvable pour ${existing.name}.`);
      }

      brainrots.push({
        ...existing,
        rarity: rarityByName.get(normalizeText(existing.name)) ?? existing.rarity
      });
      assets.push(existingAsset);
      continue;
    }

    const wikiEntry = context.wikiEntry;
    const ioEntry = context.ioEntry;
    const lolEntry = context.lolEntry;
    const displayName = definition.name;
    const slug = ioEntry?.slug ?? lolEntry?.slug ?? slugify(displayName);
    const sourceImageUrl = wikiEntry?.imageUrl ?? ioEntry?.imageUrl ?? lolEntry?.imageUrl;
    const sourcePageUrl =
      wikiEntry?.pageUrl ??
      (ioEntry ? `https://italian-brainrot.io/characters/${ioEntry.slug}/` : null) ??
      (lolEntry ? `https://italianbrainrot.lol/characters/${lolEntry.slug}` : null);

    if (!sourceImageUrl || !sourcePageUrl) {
      throw new Error(`Impossible de récupérer une image ou une page source pour ${displayName}.`);
    }

    const extension = getFileExtensionFromUrl(sourceImageUrl);
    const targetPath = `assets/brainrots/${slug}${extension}`;
    const description = pickBestDescription(displayName, [
      lolEntry?.description,
      ioEntry?.description,
      wikiEntry?.description
    ]);

    let sourceStatus: SourceStatus = 'popular_variant';

    if (definition.sourceGroup === 'official' || definition.sourceGroup === 'famous') {
      sourceStatus = 'canon';
    }

    brainrots.push({
      id: `br-${slug}`,
      name: displayName,
      slug,
      rarity: rarityByName.get(normalizeText(displayName)) ?? 'common',
      imageUrl: targetPath,
      description,
      sourceStatus,
      aliases: buildAliases(displayName, slug, context)
    });

    assets.push({
      slug,
      targetPath,
      sourcePageUrl,
      sourceImageUrl
    });
  }

  return {
    brainrots: brainrots.sort((left, right) => left.name.localeCompare(right.name, 'fr-FR')),
    assets: assets.sort((left, right) => left.slug.localeCompare(right.slug, 'fr-FR'))
  };
}

async function main(): Promise<void> {
  const { brainrots, assets } = await buildCatalog();
  const brainrotSeedPath = resolveProjectPath('data/brainrots.seed.json');
  const assetManifestPath = resolveProjectPath('data/brainrot.assets.json');

  await writeFile(brainrotSeedPath, `${JSON.stringify(brainrots, null, 2)}\n`, 'utf8');
  await writeFile(assetManifestPath, `${JSON.stringify(assets, null, 2)}\n`, 'utf8');

  console.log(
    JSON.stringify(
      {
        totalBrainrots: brainrots.length,
        totalAssets: assets.length
      },
      null,
      2
    )
  );
}

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[GENERATE_BRAINROTS] ${message}`);
  process.exitCode = 1;
});
