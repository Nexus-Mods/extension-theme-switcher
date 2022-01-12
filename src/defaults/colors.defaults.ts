export interface IColorEntry {
  name: string;
  value: string;
}

export const COLOR_DEFAULTS: IColorEntry[] = [
  { name: 'primary', value: '#d98f40' },
  { name: 'primary-darker', value: '#c87b28' },
  { name: 'primary-lighter', value: '#e0a362' },
  { name: 'secondary', value: '#2a2c2b' },
  { name: 'secondary-darker', value: '#161717' },
  { name: 'secondary-lighter', value: '#3e413f' },
  { name: 'tertiary', value: '#dddddd' },
  { name: 'tertiary-darker', value: '#c9c9c9' },
  { name: 'tertiary-lighter', value: '#f1f1f1' },
  // Backgrounds
  { name: 'background-primary', value: '#101010' },
  { name: 'background-secondary', value: '#181818' },
  { name: 'background-tertiary', value: '#222222' },
  { name: 'content-primary', value: '#1c1c1c' },
  { name: 'content-secondary', value: '#2b2d2f' },
  // Statuses
  { name: 'error', value: '#cc0000' },
  { name: 'error-darker', value: '#a30000' },
  { name: 'error-lighter', value: '#f50000' },
  { name: 'warning', value: '#f4b740' },
  { name: 'warning-darker', value: '#f2a819' },
  { name: 'warning-lighter', value: '#f6c667' },
  { name: 'success', value: '#1c8930' },
  { name: 'success-darker', value: '#156724' },
  { name: 'success-lighter', value: '#23ab3c' },
  { name: 'accent', value: '#388ffa' },
  { name: 'accent-darker', value: '#1079f9' },
  { name: 'accent-lighter', value: '#60a5fb' },
  // Borders
  { name: 'border-structural', value: '#303236' },
  { name: 'border-container', value: '#3c3f44' },
  // Fonts
  { name: 'font-primary-dark', value: '#ffffff' },
  { name: 'font-secondary-dark', value: '#aaaaaa' },
  { name: 'font-tertiary-dark', value: '#5a5a5a' },
  { name: 'font-primary-light', value: '#303030' },
  { name: 'font-secondary-light', value: '#666666' },
  { name: 'font-tertiary-light', value: '#b3b3b3' },
];

export interface V1TOV2MAP {
  /**
   * String is the old variablename, number is if pSBC will make that value darker on ligher
   */
  [newStyleVar: string]: [string, number]
};

export const V1_TO_V2_MAP: V1TOV2MAP = {
  'primary': ['brand-primary', 0],
  'primary-darker': ['brand-secondary', -0.22],
  'primary-lighter': ['brand-primary', 0.22],
  'secondary': ['brand-menu', 0],
  'secondary-darker': ['brand-menu', -0.22],
  'secondary-lighter': ['brand-menu', 0.22],
  // Ingores these three
  // 'tertiary': ['brand-secondary', 0],
  // 'tertiary-darker': ['brand-secondary', -0.22],
  // 'tertiary-lighter': ['brand-secondary', 0.22],
  'background-primary': ['brand-menu', 0],
  'background-secondary': ['brand-bg', 0],
  'background-tertiary': ['brand-bg', -0.22],
  'content-primary': ['brand-menu', 0],
  'content-secondary': ['brand-menu', 0],
  'error': ['brand-danger', 0],
  'error-darker': ['brand-danger', -0.22],
  'error-lighter': ['brand-danger', 0.22],
  'warning': ['brand-warning', 0],
  'warning-darker': ['brand-warning', -0.22],
  'warning-lighter': ['brand-warning', 0.22],
  'success': ['brand-success', 0],
  'success-darker': ['brand-success', -0.22],
  'success-lighter': ['brand-success', 0.22],
  'accent': ['brand-highlight', 0],
  'accent-darker': ['brand-highlight', -0.22],
  'accent-lighter': ['brand-highlight', 0.22],
  // Ingores these two
  // 'border-structural': [null, null],
  // 'border-container': [null, null],
  'font-primary-dark': ['text-color', 0],
  'font-secondary-dark': ['text-color', 0.22],
  'font-tertiary-dark': ['text-color', 0.33],
  'font-primary-light': ['text-color', 0],
  'font-secondary-light': ['text-color', 0.22],
  'font-tertiary-light': ['text-color', 0.33],
}