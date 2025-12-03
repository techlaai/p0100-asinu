const fs = require('fs');
const path = require('path');

const LOCALE_DIR = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'debugger-frontend',
  'dist',
  'third-party',
  'front_end',
  'core',
  'i18n',
  'locales'
);

const source = path.join(LOCALE_DIR, 'en-US.json');
const target = path.join(LOCALE_DIR, 'vi.json');

try {
  if (fs.existsSync(LOCALE_DIR) && fs.existsSync(source) && !fs.existsSync(target)) {
    fs.copyFileSync(source, target);
    console.log('[fix-devtools-locale] Added vi.json for debugger frontend');
  }
} catch (err) {
  console.warn('[fix-devtools-locale] Could not patch debugger locale', err);
}
