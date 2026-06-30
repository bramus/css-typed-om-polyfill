// All supported units with their official case (used for CSS.* factory functions)
export const FACTORY_UNITS = [
  "number", "percent",
  // Lengths
  "em", "rem", "ex", "rex", "cap", "rcap", "ch", "rch", "ic", "ric", "lh", "rlh",
  "vw", "vh", "vi", "vb", "vmin", "vmax",
  "svw", "svh", "svi", "svb", "svmin", "svmax",
  "lvw", "lvh", "lvi", "lvb", "lvmin", "lvmax",
  "dvw", "dvh", "dvi", "dvb", "dvmin", "dvmax",
  "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax",
  "cm", "mm", "Q", "in", "pt", "pc", "px",
  // Angles
  "deg", "grad", "rad", "turn",
  // Times
  "s", "ms",
  // Frequencies
  "Hz", "kHz",
  // Resolutions
  "dpi", "dpcm", "dppx",
  // Flex
  "fr"
];

export interface UnitGroup {
  units: Set<string>;
  compatible?: boolean;
  canonicalUnit?: string;
  ratios?: Record<string, number>;
}

// Unit groups with lowercase units for internal consistency
export const unitGroups = {
  fontRelativeLengths: {
    units: new Set(["em", "rem", "ex", "rex", "cap", "rcap", "ch", "rch", "ic", "ric", "lh", "rlh"])
  },
  viewportRelativeLengths: {
    units: new Set([
      "vw", "lvw", "svw", "dvw", "vh", "lvh", "svh", "dvh", "vi", "lvi", "svi", "dvi", "vb", "lvb", "svb", "dvb",
      "vmin", "lvmin", "svmin", "dvmin", "vmax", "lvmax", "svmax", "dvmax",
      "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax" // Included container queries here for completeness
    ])
  },
  absoluteLengths: {
    units: new Set(["cm", "mm", "q", "in", "pt", "pc", "px"]),
    compatible: true,
    canonicalUnit: "px",
    ratios: {
      "cm": 96 / 2.54,
      "mm": (96 / 2.54) / 10,
      "q": (96 / 2.54) / 40,
      "in": 96,
      "pc": 96 / 6,
      "pt": 96 / 72,
      "px": 1
    }
  },
  angle: {
    units: new Set(["deg", "grad", "rad", "turn"]),
    compatible: true,
    canonicalUnit: "deg",
    ratios: {
      "deg": 1,
      "grad": 360 / 400,
      "rad": 180 / Math.PI,
      "turn": 360
    }
  },
  time: {
    units: new Set(["s", "ms"]),
    compatible: true,
    canonicalUnit: "s",
    ratios: {
      "s": 1,
      "ms": 1 / 1000
    }
  },
  frequency: {
    units: new Set(["hz", "khz"]),
    compatible: true,
    canonicalUnit: "hz",
    ratios: {
      "hz": 1,
      "khz": 1000
    }
  },
  resolution: {
    units: new Set(["dpi", "dpcm", "dppx"]),
    compatible: true,
    canonicalUnit: "dppx",
    ratios: {
      "dpi": 1 / 96,
      "dpcm": 2.54 / 96,
      "dppx": 1
    }
  }
};

// Derived sets for quick lookup (all lowercase)
export const LENGTH_UNITS = new Set([
  ...unitGroups.fontRelativeLengths.units,
  ...unitGroups.viewportRelativeLengths.units,
  ...unitGroups.absoluteLengths.units
]);

export const ANGLE_UNITS = unitGroups.angle.units;
export const TIME_UNITS = unitGroups.time.units;
export const FREQUENCY_UNITS = unitGroups.frequency.units;
export const RESOLUTION_UNITS = unitGroups.resolution.units;

export const ABSOLUTE_UNITS = new Set([
  ...unitGroups.absoluteLengths.units,
  ...unitGroups.angle.units,
  ...unitGroups.time.units,
  ...unitGroups.frequency.units,
  ...unitGroups.resolution.units
]);
