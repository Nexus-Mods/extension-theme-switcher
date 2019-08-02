import settingsReducer from './reducers';
import SettingsTheme from './SettingsTheme';
import { themePath } from './util';

import * as path from 'path';
import { fs, types } from 'vortex-api';

function applyTheme(api: types.IExtensionApi, theme: string) {
  if (theme === null) {
    api.setStylesheet('variables', undefined);
    api.setStylesheet('fonts', undefined);
    api.setStylesheet('style', undefined);
  }

  fs.statAsync(path.join(theme, 'variables.scss'))
    .then(() => api.setStylesheet('variables', path.join(theme, 'variables')))
    .catch(() => api.setStylesheet('variables', undefined));

  fs.statAsync(path.join(theme, 'fonts.scss'))
    .then(() => api.setStylesheet('fonts', path.join(theme, 'fonts')))
    .catch(() => api.setStylesheet('fonts', undefined));

  fs.statAsync(path.join(theme, 'style.scss'))
    .then(() => api.setStylesheet('style', path.join(theme, 'style')))
    .catch(() => api.setStylesheet('style', undefined));
}

function init(context: types.IExtensionContext) {
  context.registerSettings('Theme', SettingsTheme);
  context.registerReducer(['settings', 'interface'], settingsReducer);

  context.once(() => {
    const store = context.api.store;

    context.api.events.on('select-theme', (themePath: string) => {
      applyTheme(context.api, themePath);
    });

    applyTheme(context.api, store.getState().settings.interface.currentTheme);
  });

  return true;
}

export default init;
