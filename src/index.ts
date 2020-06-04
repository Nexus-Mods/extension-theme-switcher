import settingsReducer from './reducers';
import SettingsTheme from './SettingsTheme';

import * as path from 'path';
import { fs, types, util } from 'vortex-api';
import { themePath } from './util';

function applyTheme(api: types.IExtensionApi, theme: string, initial: boolean) {
  if (!initial) {
    api.clearStylesheet();
  }

  if (theme === null) {
    api.setStylesheet('variables', undefined);
    api.setStylesheet('fonts', undefined);
    api.setStylesheet('style', undefined);
    return;
  }

  return util.readExtensibleDir('theme', path.join(__dirname, 'themes'), themePath())
    .then(themes => {
      const selected = themes.find(iter => path.basename(iter) === theme);
      if (selected === undefined) {
        return Promise.resolve();
      }

      return fs.statAsync(path.join(selected, 'variables.scss'))
        .then(() => api.setStylesheet('variables', path.join(selected, 'variables')))
        .catch(() => api.setStylesheet('variables', undefined))
        .then(() => fs.statAsync(path.join(selected, 'details.scss')))
        .then(() => api.setStylesheet('details', path.join(selected, 'details')))
        .catch(() => api.setStylesheet('details', undefined))
        .then(() => fs.statAsync(path.join(selected, 'fonts.scss')))
        .then(() => api.setStylesheet('fonts', path.join(selected, 'fonts')))
        .catch(() => api.setStylesheet('fonts', undefined))
        .then(() => fs.statAsync(path.join(selected, 'style.scss')))
        .then(() => api.setStylesheet('style', path.join(selected, 'style')))
        .catch(() => api.setStylesheet('style', undefined));
    });
}

function init(context: types.IExtensionContext) {
  context.registerSettings('Theme', SettingsTheme);
  context.registerReducer(['settings', 'interface'], settingsReducer);

  context.once(() => {
    const store = context.api.store;

    context.api.events.on('select-theme', (selectedThemePath: string) => {
      applyTheme(context.api, selectedThemePath, false);
    });

    return applyTheme(context.api, store.getState().settings.interface.currentTheme, true);
  });

  return true;
}

export default init;
