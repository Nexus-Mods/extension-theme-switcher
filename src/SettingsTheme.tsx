import { selectTheme } from './actions';
import ThemeEditor from './ThemeEditor';
import { themePath } from './util';

import * as Promise from 'bluebird';
import * as fontManager from 'font-scanner';
import * as path from 'path';
import * as React from 'react';
import { Alert, Button, ControlLabel, FormControl, FormGroup, InputGroup } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import * as Redux from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { actions, ComponentEx, fs, log, tooltip, types, util } from 'vortex-api';

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
      editable: this.isCustom(props.currentTheme),
    });
  }

  public componentWillMount() {
    (util as any).readExtensibleDir('theme', this.bundledPath, themePath())
      .then(themePaths => {
        this.nextState.themes = themePaths;
      })
      .then(() => {
        this.updateVariables(this.props.currentTheme);
        return fontManager.getAvailableFonts();
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
            ...(fonts || []).map(font => font.family).sort(),
          ]));
      });
  }

  public componentWillReceiveProps(newProps: IProps) {
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
                value={path.basename(currentTheme)}
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
                {t('Bundled themes can\'t be modified directly, please clone one to edit.')}
              </Alert>
            )}
          </FormGroup>
        </form>
        <ThemeEditor
          t={t}
          themePath={currentTheme}
          theme={variables}
          onApply={this.saveTheme}
          availableFonts={availableFonts}
          disabled={!editable}
          onShowDialog={onShowDialog}
        />
        { editable
            ? (
              <tooltip.IconButton
                style={{ position: 'absolute', top: 20, right: 20 }}
                className='btn-embed'
                icon='refresh'
                tooltip={t('Reload')}
                onClick={this.refresh}
              />
            ) : null }
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
    this.saveThemeInternal(this.props.currentTheme, variables)
    .then(() => {
      const { currentTheme } = this.props;
      this.context.api.events.emit('select-theme', currentTheme);
    })
    .catch(err => this.context.api.showErrorNotification(t('Unable to save theme'), err,
      // Theme directory should have been present at this point but was removed
      //  by an external factor. This could be due to:
      // (Anti Virus, manually removed by mistake, etc); this is not Vortex's fault.
      { allowReport: (err as any).code !== 'ENOENT' }));
  }

  private saveThemeInternal(themeName: string, variables: { [name: string]: string }) {
    const theme = Object.keys(variables)
      .map(name => `\$${name}: ${variables[name]};`);
    return fs.writeFileAsync(path.join(themeName, 'variables.scss'),
      '// Automatically generated. Changes to this file will be overwritten.\r\n'
      + theme.join('\r\n'));
  }

  private updateVariables(currentTheme: string) {
    const currentThemePath = currentTheme.startsWith('__')
      ? path.join(__dirname, 'themes', currentTheme.slice(2))
      : path.join(themePath(), currentTheme);

    fs.readFileAsync(path.join(currentThemePath, 'variables.scss'))
    .then(data => {
      const variables = {};
      data.toString('utf-8').split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (value !== undefined) {
          variables[key.substr(1)] = value.trim().replace(/;*$/, '');
        }
      });
      this.nextState.variables = variables;
    })
    // an exception indicates no variables set. that's fine, defaults are used
    .catch(() => {
      this.nextState.variables = {};
    });
  }

  private onClone = () => {
    this.clone();
  }

  private clone = (error?: string) => {
    const { t, currentTheme, onShowDialog } = this.props;
    const { themes } = this.state;

    onShowDialog('question', 'Enter a name', {
      bbcode: error !== undefined ? `[color=red]${error}[/color]` : undefined,
      input: [ {
          id: 'name',
          placeholder: 'Theme Name',
          value: path.basename(currentTheme),
        } ],
    }, [ { label: 'Cancel' }, { label: 'Clone' } ])
    .then(res => {
      if (res.action === 'Clone') {
        if (res.input.name &&
            (themes.findIndex(iter => path.basename(iter) === res.input.name) === -1)) {
          const targetPath = path.join(themePath(), res.input.name);
          const sourcePath = currentTheme;
          return fs.ensureDirAsync(targetPath)
            .then(() =>
              this.saveThemeInternal(path.join(themePath(), res.input.name), this.state.variables))
            .then(() => fs.readdirAsync(sourcePath))
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
    });
  }

  private remove = () => {
    const { t, currentTheme, onShowDialog } = this.props;
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
            this.nextState.themes = this.state.themes
              .filter(iter => iter !== currentTheme);
            fs.removeAsync(currentTheme)
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
    this.selectThemeImpl(evt.currentTarget.value);
  }

  private selectThemeImpl(theme: string) {
    const { themes } = this.state;
    const selectedPath = themes.find(iter => path.basename(iter) === theme);
    this.props.onSelectTheme(selectedPath);
    this.context.api.events.emit('select-theme', selectedPath);
  }

  private isCustom(theme: string): boolean {
    return !path.relative(themePath(), theme).startsWith('..');
  }
}

function mapStateToProps(state: any): IConnectedProps {
  return {
    currentTheme: state.settings.interface.currentTheme,
  };
}

type Dispatch = ThunkDispatch<types.IState, null, Redux.Action>;

function mapDispatchToProps(dispatch: Dispatch): IActionProps {
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
