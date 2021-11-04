import * as path from 'path';
import { util } from 'vortex-api';

export function themePath(): string {
  return path.join(util.getVortexPath('userData'), 'themes');
}

const getAvailableFonts = util['makeRemoteCall']('get-available-fonts',
  () => {
    const fontScanner = require('font-scanner');
    return fontScanner.getAvailableFonts()
      .then(fonts => Array.from(new Set<string>(
        [
          'Roboto',
          'Montserrat',
          'BebasNeue',
          ...(fonts || []).map(font => font.family).sort(),
        ])));
  });

export { getAvailableFonts };
