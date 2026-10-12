# AGENTS.md

This file provides context, architectural details, and workflows for AI coding agents working on `css-typed-om` (`css-typed-om-polyfill`).

---

## Project Overview

`css-typed-om` is a specification-compliant polyfill for the [CSS Typed OM Level 1 Specification](https://drafts.css-houdini.org/css-typed-om-1/) (with select Level 2 additions such as `CSSColorValue` subclasses).

It can be consumed in two ways:
1. **Global Polyfill** (`import 'css-typed-om'` or `build/css-typed-om.iife.js`): Patches `window` with all CSS Typed OM classes, `CSS.*` unit factory functions, `Element.prototype.computedStyleMap`, `HTMLElement`/`SVGElement`/`MathMLElement` `.attributeStyleMap` & `.styleMap`, and `CSSStyleRule.prototype.styleMap`.
2. **Explicit Module Imports** (`import { CSSUnitValue, ... } from 'css-typed-om'`): Exports classes for direct usage.

---

## Repository Structure

```text
├── build/                          # Generated outputs (gitignored, built via `npm run build`)
│   ├── index.js                    # ESM bundle (+ index.js.map)
│   ├── index.d.ts                  # TypeScript declaration bundle
│   └── css-typed-om.iife.js        # IIFE bundle (injected into WPT runner)
├── src/
│   ├── index.ts                    # Entry point: exports & global browser patching / WebIDL setup
│   ├── style-property-map.ts       # StylePropertyMapReadOnly & StylePropertyMap implementations
│   ├── units.ts                    # Unit categories (length, angle, time, frequency, resolution) & factory list
│   ├── utils.ts                    # DOM probing helpers (getDummyStyle, isSupportedProperty, isShorthandProperty)
│   ├── css-style-value/            # Base CSSStyleValue, CSSKeywordValue, CSSUnparsedValue, CSSVariableReferenceValue, CSSImageValue
│   ├── css-numeric-value/          # CSSNumericValue, CSSUnitValue, CSSNumericArray, CSSMathValue & math subclasses
│   ├── css-transform-value/        # CSSTransformValue, CSSTransformComponent & transform subclasses (2D/3D matrix math)
│   ├── css-color-value/            # CSSColorValue, CSSRGB, CSSHSL, CSSHWB, CSSLab, CSSLCH, CSSOKLab, CSSOKLCH, CSSColor
│   └── parser/
│       ├── tokenizer.ts            # CSS Syntax Level 3 tokenizer
│       ├── css-value-parser.ts     # Property-aware CSS value parser (CSSStyleValue.parse / parseAll)
│       ├── css-numeric-parser.ts   # Mathematical expression & calc() parser (CSSNumericValue.parse)
│       ├── simplify-calculation.ts # Spec-compliant calc() simplification & unit canonicalization
│       └── unit-utils.ts           # Unit type maps and conversion factors
└── tests/
    ├── unit/                       # Fast Vitest unit tests (run in Node with JSDOM)
    └── wpt/                        # Official Web Platform Tests (WPT) integration
        ├── wpt-commit.txt          # Pinned WPT repository commit hash
        ├── expected.txt            # Deterministic snapshot of all WPT test & subtest results
        ├── firefox/                # Downloaded macOS Firefox binaries & profiles (gitignored)
        ├── report/                 # Generated WPT JSON/HTML reports (gitignored)
        ├── src/                    # Shallow git checkout of web-platform-tests/wpt (gitignored)
        └── scripts/
            ├── checkout-wpt.mjs    # Clones/fetches WPT at the commit in wpt-commit.txt & warns on age
            ├── download-firefox.mjs# Downloads pinned Firefox .dmg from ftp.mozilla.org & creates profile
            ├── generate-expected.js# Converts report/data.json -> expected.txt and updates README.md stats
            └── update-wpt.mjs      # Pulls latest WPT master and updates wpt-commit.txt
```

---

## Key Architectural Details & Design Decisions

### 1. Browser CSS Parser Probing (`getDummyStyle()`)
Rather than bundling a multi-hundred-kilobyte CSS property grammar database, the polyfill delegates per-property grammar and range checks to the host browser's native CSS parser using a detached `document.createElement('div').style` ([`getDummyStyle()`](src/utils.ts)):
- **Property Support ([`isSupportedProperty`](src/utils.ts)):** Checks whether the camelCased property exists on the dummy `CSSStyleDeclaration` (or starts with `--`).
- **Shorthand Detection ([`isShorthandProperty`](src/utils.ts)):** Sets `dummy.setProperty(prop, 'inherit')` and checks if `dummy.length > 1` (plus `all`).
- **Value Validation ([`validateValuesForProperty`](src/style-property-map.ts) & [`parseCSSValue`](src/parser/css-value-parser.ts)):** Tests `dummy.setProperty(property, validationString)` and throws a `TypeError` if `dummy.getPropertyValue(property) === ''`.
- **Out-of-Range `calc()` Wrapping ([`shouldWrapInCalc`](src/style-property-map.ts)):** Per the CSS Typed OM spec, setting an out-of-range `CSSUnitValue` (such as `-10px` on `padding-top`, which requires `<length [0,∞]>`) via `StylePropertyMap.set()` must wrap the value in `calc(-10px)` so it reifies back as a `CSSMathSum`. `shouldWrapInCalc` detects this by checking if `temp.setProperty(property, val.toString())` is rejected by the browser while `temp.setProperty(property, 'calc(' + val.toString() + ')')` is accepted.

> **Important Implication for WPT Failures:**
> Because property validation and `computedStyleMap()` rely on the underlying browser (Firefox in WPT runs), tests for newly spec'd CSS properties, newly added keywords (e.g. `position-visibility: anchor-valid`), or relaxed property ranges (e.g. negative `overflow-clip-margin`) will fail in WPT if the pinned Firefox version has not yet implemented that CSS change natively. **Do not hardcode property-specific hacks in the polyfill** to work around missing CSS property support in the host browser; `element.style.setProperty()` and `window.getComputedStyle()` will still drop unsupported values.

### 2. Private Constructor Token
WebIDL interfaces without public constructors (`CSSStyleValue` when instantiated directly, `CSSImageValue`, `StylePropertyMapReadOnly`, `StylePropertyMap`) guard their constructors using:
```ts
Symbol.for('css-typed-om-polyfill-private-token')
```
Calling `new CSSStyleValue()` from user/test code without this token throws `TypeError('Illegal constructor')`. Subclasses (`CSSKeywordValue`, `CSSUnitValue`, etc.) check `this.constructor === CSSStyleValue` so `super()` calls succeed.

### 3. WebIDL Conformance in `src/index.ts`
To pass WPT's `idlharness.html` tests, [`src/index.ts`](src/index.ts) performs several WebIDL adjustments when patching `window`:
- Sets global interface constructors as non-enumerable (`enumerable: false`, `writable: true`, `configurable: true`).
- Enforces exact `.length` on constructors (`expectedLengths`) and `.name` properties.
- Makes prototype and static members enumerable.
- Sets `Symbol.toStringTag` on prototypes.
- Patches value-iterable interfaces (`CSSUnparsedValue`, `CSSNumericArray`, `CSSTransformValue`) to use `Array.prototype` methods (`keys`, `values`, `entries`, `forEach`, `[Symbol.iterator]`).
- Handles non-extensible native `window.CSS` objects by cloning descriptors onto a new extensible object before attaching `CSS.<unit>()` factory functions.

### 4. `StylePropertyMap` Caching & Shorthands
- `StylePropertyMap` maintains an internal `_cache` mapping property names to `{ values, serialized }` so that setting a typed value and reading it back via `.get()` / `.getAll()` preserves exact Typed OM representation as long as the underlying `style.getPropertyValue(property)` hasn't been mutated externally.
- When a CSSStyleValue is reified from a shorthand property (or an unsupported computed property), `_associatedProperty` is attached to the base `CSSStyleValue` instance so it can only be `.set()` back onto the same property (throwing a `TypeError` if set on a different property, per spec).

---

## Commands & Workflows

### Build
```bash
npm run build
```
Runs `clean` (`rm -rf ./build`), then builds:
- `npm run build:module` — ESM bundle (`build/index.js`) via `esbuild`
- `npm run build:iife` — IIFE bundle (`build/css-typed-om.iife.js`) via `esbuild`
- `npm run build:types` — TypeScript declarations (`build/index.d.ts`) via `tsc`

### Unit Tests (Fast)
```bash
npm run test:unit
```
Builds the project and runs Vitest on `tests/unit/*.test.ts`. Always run this first when making changes to parser, numeric, transform, color, or `StylePropertyMap` logic.

### Web Platform Tests (WPT)

#### Full WPT Suite
```bash
npm run test:wpt
```
1. Builds the project (`build/css-typed-om.iife.js`).
2. Runs `npm run test:wpt:setup` (ensures `tests/wpt/src` is at `tests/wpt/wpt-commit.txt` and downloads the pinned Firefox binary into `tests/wpt/firefox/`).
3. Runs the full `css/css-typed-om` WPT suite in headless Firefox with `--setpref layout.css.typed-om.enabled=false` and `--inject-script ../../../build/css-typed-om.iife.js`.
4. Runs `npm run test:wpt:report` (`tests/wpt/scripts/generate-expected.js`), which updates `tests/wpt/expected.txt` and the pass/fail counters in `README.md`.

> **Note:** Native CSS Typed OM in Firefox (`layout.css.typed-om.enabled`) **must** remain explicitly set to `false` in `package.json` and `tests/wpt/scripts/download-firefox.mjs` so that WPT always tests the polyfill and never Firefox's incomplete native implementation.

#### Running a Single WPT Test (Fast Debugging)
Running the full WPT suite takes ~8–9 minutes (406 test files). When debugging a specific test, build first and invoke `python wpt run` on the single test path without overwriting `report/data.json`:
```bash
npm run build && (cd tests/wpt/src && python wpt run --headless -y --setpref layout.css.typed-om.enabled=false --binary "../firefox/Firefox 157.0.app/Contents/MacOS/firefox" --inject-script ../../../build/css-typed-om.iife.js firefox css/css-typed-om/the-stylepropertymap/properties/overflow-clip-margin.html)
```

#### Updating WPT or Firefox
- **Update WPT commit:** Run `npm run test:wpt:update` to pull the latest WPT `master` and update `tests/wpt/wpt-commit.txt`, then run `npm run test:wpt` to regenerate `tests/wpt/expected.txt` and `README.md`.
- **Update Firefox version:** Update the version string (e.g. `157.0`) in both `package.json` (`test:wpt` and `test:wpt:setup`) and `tests/wpt/scripts/download-firefox.mjs`, then run `npm run test:wpt`.
