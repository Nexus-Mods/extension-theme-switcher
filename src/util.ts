import * as path from 'path';
import { util } from 'vortex-api';

export function themePath(): string {
  return path.join(util.getVortexPath('userData'), 'themes');
}
