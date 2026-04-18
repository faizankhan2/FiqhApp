import { Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = (width - 48) / 2;

export const T = {
  // Backgrounds
  pageBg:      '#F7F6F1',     // Warm parchment
  cardBg:      '#FFFFFF',
  cardAccent:  '#EEF4EC',     // Soft sage tint
  inputBg:     '#F0EFEA',

  // Situation Card Colors (Pastels)
  pastelBlue:  '#E3EDF7',
  pastelGreen: '#EEF4EC',
  pastelBeige: '#F5EDE0',
  pastelPurple:'#EDE3F3',

  // Borders
  border:      '#E8E6E1',
  borderLight: '#F0EFEA',

  // Text
  ink:         '#2C2C2C',
  inkSoft:     '#5A5A5A',
  inkMuted:    '#9B9B93',
  inkWhite:    '#FFFFFF',

  // Accents
  sage:        '#7EA87E',
  sageBg:      '#EEF4EC',

  // Action badges
  fard:        { bg: '#DFF0D8', text: '#2D6A2E' },
  sunnah:      { bg: '#D9EDF7', text: '#2B5C7E' },
  makruh:      { bg: '#FFF3CD', text: '#856404' },
  haram:       { bg: '#F2DEDE', text: '#A94442' },
  neutral:     { bg: '#EDECE8', text: '#6B6B63' },

  shadow: Platform.select({
    ios: { shadowColor: '#C5C3BB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 8 },
    android: { elevation: 2 },
    default: { shadowColor: '#C5C3BB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 8 },
  }),

  r: 16,
  rCard: 20,
  rPill: 20,
};

// ── Icon mapping ────────────────────────────────────────────────────

export const ICON_TABLE = {
  water: 'droplet', droplet: 'droplet', wudu: 'droplet', ablution: 'droplet',
  purification: 'droplet', clean: 'droplet', washing: 'droplet', ghusl: 'droplet',
  prayer: 'sun', salah: 'sun', mosque: 'home', masjid: 'home',
  book: 'book-open', quran: 'book', hadith: 'book-open', ruling: 'file-text',
  law: 'file-text', food: 'coffee', drink: 'coffee',
  charity: 'heart', zakat: 'heart', sadaqah: 'gift',
  money: 'dollar-sign', finance: 'dollar-sign', trade: 'repeat',
  family: 'users', marriage: 'heart', children: 'users',
  warning: 'alert-triangle', prohibition: 'x-circle', forbidden: 'x-circle',
  travel: 'navigation', time: 'clock', calendar: 'calendar',
  health: 'activity', star: 'star', shield: 'shield', check: 'check-circle',
};

export const MADHHAB_FILTERS = ['All', 'Hanafi', 'Maliki', "Shafi'i", 'Hanbali'];
