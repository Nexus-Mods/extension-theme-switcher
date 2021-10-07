import React, { FunctionComponent } from 'react';


export const getCSSCustomProp = (propKey: string, element = document.documentElement, castAs = 'string') => {
  let response = getComputedStyle(element).getPropertyValue(propKey);

  // Tidy up the string if there's something to work with
  if (response.length) {
    response = response.replace(/'|"/g, '').trim();
  }

  // Convert the response into a whatever type we wanted
  switch (castAs) {
    case 'number':
    case 'int':
      return parseInt(response, 10);
    case 'float':
      return parseFloat(response);
    case 'boolean':
    case 'bool':
      return response === 'true' || response === '1';
  }

  // Return the string response by default
  return response;
};

interface ColourBlockProps {
  name: string;
  description: string;
  hasLighterDarker?: boolean;
}

interface FontBlockProps {
  name: string;
  propName?: string;
  description: string;
  background: string;
}

interface BorderBlockProps {
  name: string;
  description: string;
  background: string;
  propName: string;
  border: string;
}

const capitalise = (phrase: string): string => phrase.split(/[\s-]/).map((word) => word[0].toUpperCase() + word.substr(1)).join(' ');

const ColourBlock = ({
  name,
  description,
  hasLighterDarker = true,
}: ColourBlockProps) => (
  <div className="bg-background-tertiary rounded-lg font-montserrat w-48 mr-6 overflow-hidden border border-border-structural">
    <div className={`h-32 w-48 relative rounded-b-lg bg-${name}`}>
      {hasLighterDarker ? (
        <div
          className="absolute flex"
          style={{ bottom: '1rem', left: '1rem' }}
        >
          <div className={`rounded-full rounded-tl-none h-8 w-8 bg-${name}-darker mr-4`} />
          <div className={`rounded-full rounded-tl-none h-8 w-8 bg-${name}-lighter`} />
        </div>
      ) : undefined}
    </div>
    <div className="p-4">
      <p className="font-bold mb-2">{capitalise(name)}</p>
      <p className="text-font-secondary font-medium text-sm mb-1">{description}</p>
      <p className="text-font-secondary font-medium text-sm">{`${name.split(/-/).reverse()[0].toUpperCase()}: ${getCSSCustomProp(`--${name}`)}`}</p>
      {hasLighterDarker ? (
        <>
          <p className="text-font-secondary font-medium text-sm">{`DARKER: ${getCSSCustomProp(`--${name}-darker`)}`}</p>
          <p className="text-font-secondary font-medium text-sm">{`LIGHTER: ${getCSSCustomProp(`--${name}-lighter`)}`}</p>
        </>
      ) : undefined}
    </div>
  </div>
);

const FontBlock = ({
  name,
  propName = name,
  description,
  background,
}: FontBlockProps) => (
  <div className="bg-background-tertiary rounded-lg font-montserrat w-48 mr-6 overflow-hidden border border-border-structural">
    <div className={`h-32 w-48 relative rounded-b-lg bg-${background} flex items-center px-8`}>
      <p className={`text-font-${name} text-6xl font-medium leading-none`}>Aa</p>
    </div>
    <div className="p-4">
      <p className="font-bold mb-2">{capitalise(name)}</p>
      <p className="text-font-secondary font-medium text-sm mb-1">{description}</p>
      <p className="text-font-secondary font-medium text-sm">{`${capitalise(name.split(/-/)[0])}: ${getCSSCustomProp(`--font-${propName}`)}`}</p>
    </div>
  </div>
);

const BorderBlock = ({
  name,
  description,
  propName,
  background,
  border,
}: BorderBlockProps) => (
  <div className={`bg-background-tertiary rounded-lg font-montserrat w-48 mr-6 overflow-hidden border border-${border}`}>
    <div className={`h-32 w-48 relative rounded-b-lg bg-${background}`} />
    <div className="p-4">
      <p className="font-bold mb-2">{name}</p>
      <p className="text-font-secondary font-medium text-sm mb-1">{description}</p>
      <p className="text-font-secondary font-medium text-sm">{`Border: ${getCSSCustomProp(`--${propName}`)}`}</p>
    </div>
  </div>
);

export const ColorPalette: FunctionComponent = (() => {
  return (
    <div className="color-palette-grid pt-2">
      <div className="mb-8">
        <h1 className="text-lg text-font-primary font-bold font-montserrat mb-4">
          Branding
        </h1>
        <div className="flex">
          {/* no-purge bg-primary bg-primary-darker bg-primary-lighter */}
          <ColourBlock
            name="primary"
            description="Used as the primary colour."
          />
          {/* no-purge bg-secondary bg-secondary-darker bg-secondary-lighter */}
          <ColourBlock
            name="secondary"
            description="Used for accents & actions."
          />
          {/* no-purge bg-tertiary bg-tertiary-darker bg-tertiary-lighter */}
          <ColourBlock
            name="tertiary"
            description="Minor CTAs and outlines."
          />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-lg text-font-primary font-bold font-montserrat mb-4">
          Backgrounds
        </h1>
        <div className="flex">
          {/* no-purge bg-background-primary */}
          <ColourBlock
            name="background-primary"
            description="Primary background"
            hasLighterDarker={false}
          />
          {/* no-purge bg-background-secondary */}
          <ColourBlock
            name="background-secondary"
            description="Default site wide background"
            hasLighterDarker={false}
          />
          {/* no-purge bg-background-tertiary */}
          <ColourBlock
            name="background-tertiary"
            description="Default site wide background"
            hasLighterDarker={false}
          />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-lg text-font-primary font-bold font-montserrat mb-4">
          Content
        </h1>
        <div className="flex">
          {/* no-purge bg-content-primary */}
          <ColourBlock
            name="content-primary"
            description="Primary background"
            hasLighterDarker={false}
          />
          {/* no-purge bg-content-secondary */}
          <ColourBlock
            name="content-secondary"
            description="Secondary background"
            hasLighterDarker={false}
          />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-lg text-font-primary font-bold font-montserrat mb-4">
          Status
        </h1>
        <div className="flex">
          {/* no-purge bg-danger bg-danger-darker bg-danger-lighter */}
          <ColourBlock
            name="danger"
            description="Used for danger states"
          />
          {/* no-purge bg-warning bg-warning-darker bg-warning-lighter */}
          <ColourBlock
            name="warning"
            description="Used to represent caution."
          />
          {/* no-purge bg-success bg-success-darker bg-success-lighter */}
          <ColourBlock
            name="success"
            description="Used for success states."
          />
          {/* no-purge bg-accent bg-accent-darker bg-accent-lighter */}
          <ColourBlock
            name="accent"
            description="Used for highlighting new features and updates."
          />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-lg text-font-primary font-bold font-montserrat mb-4">
          Border
        </h1>
        <div className="flex">
          {/* no-purge bg-border-structural border-border-structural */}
          <BorderBlock
            name="Structural borders"
            description="Border for wider page structural containers and dividers"
            background="border-structural"
            propName="border-structural"
            border="border-structural"
          />
          {/* no-purge bg-border-container border-border-container */}
          <BorderBlock
            name="Container borders"
            description="Border for individual containers"
            background="background-secondary"
            propName="border-container"
            border="border-container"
          />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-lg text-font-primary font-bold font-montserrat mb-4">
          Font - dark
        </h1>
        <div className="flex">
          {/* no-purge text-font-primary */}
          <FontBlock
            name="primary"
            propName="primary-dark"
            description="Primary font colour"
            background="background-secondary"
          />
          {/* no-purge text-font-secondary */}
          <FontBlock
            name="secondary"
            propName="secondary-dark"
            description="Subtitles"
            background="background-secondary"
          />
          {/* no-purge text-font-tertiary */}
          <FontBlock
            name="tertiary"
            propName="tertiary-dark"
            description="Small text & hint text"
            background="background-secondary"
          />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-lg text-font-primary font-bold font-montserrat mb-4">
          Font - light
        </h1>
        <div className="flex">
          {/* no-purge text-font-primary-light */}
          <FontBlock
            name="primary-light"
            description="Primary font colour"
            background="font-primary"
          />
          {/* no-purge text-font-secondary-light */}
          <FontBlock
            name="secondary-light"
            description="Subtitles"
            background="font-primary"
          />
          {/* no-purge text-font-tertiary-light */}
          <FontBlock
            name="tertiary-light"
            description="Small text & hint text"
            background="font-primary"
          />
        </div>
      </div>
    </div>
  );
});