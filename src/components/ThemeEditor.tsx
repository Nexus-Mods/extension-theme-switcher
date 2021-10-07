import React, { FunctionComponent } from 'react';
import { IColorEntry } from '../defaults/colors.defaults'
import { Col, OverlayTrigger, Popover } from 'react-bootstrap';

import { ChromePicker } from 'react-color';

interface IColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}


interface IColorProps {
  name: string;
  color: IColor;
  disabled: boolean;
  onUpdateColor: (name: string, colorHex: string) => void;
}


function toHex(num: number): string {
  let res = num.toString(16);
  if (num < 16) {
    res = '0' + res;
  }
  return res;
}

function colorToHex(color: IColor): string {
  return '#'
    + toHex(color.r)
    + toHex(color.g)
    + toHex(color.b);
}

function colorFromHex(colorHex: string): IColor {
  const parts = colorHex.substr(1).match(/.{2}/g);
  return {
    r: parseInt(parts[0], 16),
    g: parseInt(parts[1], 16),
    b: parseInt(parts[2], 16),
  };
}

function renderColorBox(color: IColor): JSX.Element {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        display: 'inline-block',
        border: 'solid 1px gray',
        marginLeft: 4,
        backgroundColor: colorToHex(color),
      }}
    />
  );
}

class ColorPreview extends React.Component<IColorProps, {}> {
  public render(): JSX.Element {
    const { color, disabled } = this.props;
    const popover = (
      <Popover
        id='color-preview'
      >
        <ChromePicker
          color={color}
          disableAlpha={true}
          onChangeComplete={this.onUpdate}
        />
      </Popover>
    );

    const content = (
      <div>
        {colorToHex(color)}
        {renderColorBox(color)}
      </div>
    );

    return disabled ? content : (
      <OverlayTrigger trigger='click' rootClose placement='top' overlay={popover}>
        {content}
      </OverlayTrigger>
    );
  }

  private onUpdate = (color: any) => {
    const { name, onUpdateColor } = this.props;
    onUpdateColor(name, color.hex);
  }
}

const renderEntry = (entry: IColorEntry, value: string, disabled: boolean, updateColor: (name: string, colorHex: string) => void) => {
  return (
    <Col key={entry.name} sm={4} md={4} lg={4} style={{ display: 'inline-flex' }}>
      <span style={{ marginRight: 'auto' }}>{entry.name}</span>
      <ColorPreview
        name={entry.name}
        color={colorFromHex(value || entry.value)}
        onUpdateColor={updateColor}
        disabled={disabled}
      />
    </Col>
  );
}

export interface ThemeEditorProps {
  buckets: IColorEntry[][]
  colors: { [key: string]: string; }
  disabled: boolean,
  onUpdateColor: (name: string, colorHex: string) => void
}

export const ThemeEditor: FunctionComponent<ThemeEditorProps> = (({
  buckets,
  colors,
  disabled,
  onUpdateColor
}) => {
  return (
    <>
      {
        buckets[0].map((value, idx) => {
          return (
            buckets.map(bucket =>
              bucket[idx] !== undefined
                ? renderEntry(bucket[idx], colors[bucket[idx].name], disabled, onUpdateColor)
                : null)
          );
        })
      }
    </>
  );
});