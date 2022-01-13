import { selectTheme } from './actions';
import ThemeEditor from './ThemeEditor';
import { themePath } from './util';

import Promise from 'bluebird';
import * as path from 'path';
import * as React from 'react';
import { Alert, Button, ControlLabel, FormControl, FormGroup, InputGroup } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { actions, ComponentEx, fs, log, tooltip, types, util } from 'vortex-api';
import { COLOR_DEFAULTS, V1_TO_V2_MAP } from './defaults/colors.defaults';
import { pSBC } from './utils/pSBC';

interface IConnectedProps {
  currentTheme: string;
}

interface IActionProps {
  onSelectTheme: (theme: string) => void;
  onShowDialog: (
    type: types.DialogType,
    title: string,
    content: types.IDialogContent,
    actions: types.DialogActions,
  ) => Promise<types.IDialogResult>;
}

type IProps = IConnectedProps & IActionProps;

interface IComponentState {
  isOldTheme: boolean;
  themes: string[];
  availableFonts: string[];
  variables: { [key: string]: string };
  editable: boolean;
}

class SettingsTheme extends ComponentEx<IProps, IComponentState> {
  constructor(props: IProps) {
    super(props);

    this.initState({
      themes: [],
      availableFonts: [],
      variables: {},
      editable: false,
      isOldTheme: false,
    });
  }

  public UNSAFE_componentWillMount() {
    util.readExtensibleDir('theme', this.bundledPath, themePath())
      .then(themePaths => {
        this.nextState.themes = themePaths;
      })
      .then(() => {
        this.updateVariables(this.props.currentTheme);
        this.nextState.editable = this.isCustom(this.props.currentTheme);
      })
      .catch(err => {
        log('error', 'failed to request list of fonts', err.message);
        return [];
      })
      .then((fonts: any[]) => {
        this.nextState.availableFonts = Array.from(new Set<string>(
          [
            'Roboto',
            'BebasNeue',
            'Montserrat',
            ...(fonts || []).map(font => font.family).sort(),
          ]));
      });
  }

  public UNSAFE_componentWillReceiveProps(newProps: IProps) {
    if (this.props.currentTheme !== newProps.currentTheme) {
      this.updateVariables(newProps.currentTheme);
      this.nextState.editable = this.isCustom(newProps.currentTheme);
    }
  }

  public render(): JSX.Element {
    const { t, currentTheme, onShowDialog } = this.props;
    const { availableFonts, editable, themes, variables } = this.state;
    return (
      <div style={{ position: 'relative' }}>
        <form>
          <FormGroup controlId='themeSelect'>
            <ControlLabel>{t('Theme')}</ControlLabel>
            <InputGroup style={{ width: 300 }}>
              <FormControl
                componentClass='select'
                onChange={this.selectTheme}
                value={currentTheme}
              >
                {themes.map(iter => {
                  const theme = path.basename(iter);
                  return this.renderTheme(theme, theme);
                })}
              </FormControl>
              <InputGroup.Button>
                <Button bsStyle='primary' onClick={this.onClone} >{t('Clone')}</Button>
                {editable
                  ? <Button bsStyle='primary' onClick={this.remove}>{t('Remove')}</Button>
                  : null}
              </InputGroup.Button>
            </InputGroup>
            {editable ? null : (
              <Alert bsStyle='info'>
                {t('Please clone this theme to modify it.')}
              </Alert>
            )}
            {this.state.isOldTheme ? (
              <Alert bsStyle='info'>
                {t('This theme is no longer supported, but if you clone it and re-apply it, Vortex will try to convert it to a V2 compatible version')}
              </Alert>
            ) : undefined}
          </FormGroup>
        </form>
        <ThemeEditor
          t={t}
          themePath={this.themePath(currentTheme)}
          theme={variables}
          onApply={this.saveTheme}
          disabled={!editable}
          onShowDialog={onShowDialog}
        />
        {editable
          ? (
            <tooltip.IconButton
              style={{ position: 'absolute', top: 20, right: 20 }}
              className='btn-embed'
              icon='refresh'
              tooltip={t('Reload')}
              onClick={this.refresh}
            />
          ) : null}
      </div>
    );
  }

  public renderTheme(key: string, name: string) {
    return <option key={key} value={key}>{name}</option>;
  }

  private get bundledPath(): string {
    return path.join(__dirname, 'themes');
  }

  private refresh = () => {
    const { currentTheme } = this.props;
    this.context.api.events.emit('select-theme', currentTheme);
  }

  private saveTheme = (variables: { [name: string]: string }) => {
    const { t } = this.props;
    this.saveThemeInternal(path.join(themePath(), this.props.currentTheme), variables)
      .then(() => {
        const { currentTheme } = this.props;
        this.nextState.isOldTheme = false;
        this.context.api.events.emit('select-theme', currentTheme);
      })
      .catch(err => this.context.api.showErrorNotification(t('Unable to save theme'), err,
        // Theme directory should have been present at this point but was removed
        //  by an external factor. This could be due to:
        // (Anti Virus, manually removed by mistake, etc); this is not Vortex's fault.
        { allowReport: (err as any).code !== 'ENOENT' }));
  }

  private saveThemeInternal(outputPath: string, variables: { [name: string]: string }) {
    const theme = Object.keys(variables)
      .map(name => `\$${name}: ${variables[name]};`);
    return fs.writeFileAsync(path.join(outputPath, 'variables.scss'),
      '// Automatically generated. Changes to this file will be overwritten.\r\n'
      + theme.join('\r\n'));
  }

  private updateVariables(themeName: string) {
    const currentThemePath = this.themePath(themeName);
    if (currentThemePath === undefined) {
      // likely was deleted outside Vortex
      log('warn', 'theme not found', themeName);
      this.nextState.variables = {};
      return;
    }

    // Load variables from the variables.scss
    fs.readFileAsync(path.join(currentThemePath, 'variables.scss'))
      .then(data => {
        const variables = {};
        data.toString('utf-8').split('\r\n').forEach(line => {
          const [key, value] = line.split(':');
          if (value !== undefined) {
            variables[key.substr(1)] = value.trim().replace(/;*$/, '');
          }
        });
        const themeEngineVersion = Number(variables['theme-engine-version'] ?? 1);
        // Check if it's a V1 theme
        if (themeEngineVersion < 2) {
          // If it's old theme, use the color default to generate the new variables
          const newVars = COLOR_DEFAULTS.reduce(
            (accumulator, curr) => {
              accumulator[curr.name] = curr.value;
              return accumulator;
            }, {},
          );
          for (const key in newVars) {
            if (V1_TO_V2_MAP[key]) {
              const mapper = V1_TO_V2_MAP[key];
              // Then using pSBC convert the old variables to new variables
              newVars[key] = pSBC(mapper[1], variables[mapper[0]]);
            }
          }
          this.nextState.variables = newVars;
        } else {
          this.nextState.variables = variables;
        }
        this.nextState.isOldTheme = !!themeEngineVersion;
      })
      // an exception indicates no variables set. that's fine, defaults are used
      .catch(() => {
        this.nextState.variables = {};
      });
  }

  private onClone = () => {
    this.context.api.events.emit('analytics-track-click-event', 'Themes', 'Clone theme');
    this.clone();
  }

  private clone = (error?: string) => {
    const { t, currentTheme, onShowDialog } = this.props;
    const { themes } = this.state;

    util.getNormalizeFunc(themePath())
      .then(normalize => {
        const existing = new Set(themes.map(theme => normalize(path.basename(theme))));
        return onShowDialog('question', 'Enter a name', {
          bbcode: error !== undefined ? `[color=red]${error}[/color]` : undefined,
          input: [{
            id: 'name',
            placeholder: 'Theme Name',
            value: currentTheme !== '__default' ? currentTheme : '',
          }],
          condition: (content: types.IDialogContent) => {
            const res: types.IConditionResult[] = [];
            const { value } = content.input[0];
            if ((value !== undefined) && (existing.has(normalize(value)))) {
              res.push({
                id: 'name',
                errorText: 'Name already used',
                actions: ['Clone'],
              });
            }
            if (!(util as any).isFilenameValid(value)) {
              res.push({
                id: 'name',
                errorText: 'Invalid symbols in name',
                actions: ['Clone'],
              });
            }
            return res;
          },
        }, [{ label: 'Cancel' }, { label: 'Clone' }]);
      })
      .then(res => {
        if (res.action === 'Clone') {
          if (res.input.name &&
            (themes.findIndex(iter => path.basename(iter) === res.input.name) === -1)) {
            const targetPath = path.join(themePath(), res.input.name);
            const sourcePath = this.themePath(currentTheme);
            return fs.ensureDirAsync(targetPath)
              .then(() =>
                this.saveThemeInternal(path.join(themePath(), res.input.name), this.state.variables))
              .then(() => (sourcePath !== undefined)
                ? fs.readdirAsync(sourcePath)
                : Promise.resolve([]))
              .map(files => fs.copyAsync(path.join(sourcePath, files), path.join(targetPath, files)))
              .then(() => {
                this.nextState.themes.push(targetPath);
                this.selectThemeImpl(res.input.name);
              })
              .catch(err => this.context.api.showErrorNotification(
                t('Failed to read theme directory'),
                err,
                // Theme directory has been removed by an external method -
                // (Anti Virus, manually removed by mistake, etc); this is not Vortex's fault.
                { allowReport: (err as any).code !== 'ENOENT' }));
          } else {
            this.clone(t('Name already used.'));
          }
        }
        return Promise.resolve();
      })
      .catch(err => {
        this.context.api.showErrorNotification('Failed to clone theme', err);
      });
  }

  private remove = () => {
    const { t, currentTheme, onShowDialog } = this.props;
    log('info', 'removing theme', currentTheme);
    if (!currentTheme || !this.isCustom(currentTheme)) {
      throw new Error('invalid theme');
    }
    onShowDialog('question', t('Confirm removal'), {
      text: t('Are you sure you want to remove the theme "{{theme}}"', {
        replace: { theme: currentTheme },
      }),
    }, [
      { label: 'Cancel' },
      {
        label: 'Confirm',
        action: () => {
          this.selectThemeImpl('default');
          const currentThemePath = this.themePath(currentTheme);
          this.nextState.themes = this.state.themes
            .filter(iter => iter !== currentThemePath);
          fs.removeAsync(currentThemePath)
            .then(() => {
              log('info', 'removed theme', currentTheme);
            })
            .catch(err => {
              log('error', 'failed to remove theme', { err });
            });
        },
      },
    ]);
  }

  private selectTheme = (evt) => {
    this.context.api.events.emit('analytics-track-click-event', 'Themes', 'Select theme');
    this.selectThemeImpl(evt.currentTarget.value);
  }

  private selectThemeImpl(theme: string) {
    this.props.onSelectTheme(theme);
    this.context.api.events.emit('select-theme', theme);
  }

  private themePath = (themeName: string): string => {
    const { themes } = this.state;
    themeName = themeName.replace(/^__/, '');
    return themes.find(theme => path.basename(theme) === themeName);
  }

  private isCustom = (themeName: string): boolean => {
    const themeFilePath = this.themePath(themeName);
    if (themeFilePath === undefined) {
      // We don't have the filepath to this theme..
      //  possibly a race condition ? if so, this should
      //  clear up next time the state updates.
      //  https://github.com/Nexus-Mods/Vortex/issues/7191
      //
      // the above issue was in the remove callback so the likely scenario is
      // that that event was triggered twice and on the second time it was handled
      // the theme is already gone.
      return false;
    }

    // isChildPath plays a bit fast and loose when it comes to directory normalization
    // if we don't pass in a normalizer, but that shouldn't be a problem here, the official
    // themes are in the application folder and the themes are in APPDATA or ProgramData so
    // upper/lower case shouldn't be that big of a deal
    return util.isChildPath(themeFilePath, themePath());
  }
}

function mapStateToProps(state: any): IConnectedProps {
  return {
    currentTheme: state.settings.interface.currentTheme,
  };
}

type Dispatch = ThunkDispatch<types.IState, null, Redux.Action>;

function mapDispatchToProps(dispatch: ThunkDispatch<any, any, Redux.Action>): IActionProps {
  return {
    onSelectTheme: (theme: string) => dispatch(selectTheme(theme)),
    onShowDialog: (type, title, content, dialogActions) =>
      dispatch(actions.showDialog(type, title, content, dialogActions)),
  };
}

export default
  withTranslation(['common'])(
    connect(mapStateToProps, mapDispatchToProps)(
      SettingsTheme) as any) as React.ComponentClass<{}>;
