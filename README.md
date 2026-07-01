# CSS Typed OM Polyfill

This polyfill brings the [CSS Typed OM Level 1 Specification](https://drafts.css-houdini.org/css-typed-om-1/) to browsers that do not yet support it, allowing you to interact with CSS values as typed JavaScript objects rather than strings.

This project is fully tested using the official [Web Platform Tests (WPT)](https://github.com/web-platform-tests/wpt).

<!-- WPT_STATUS_START -->
- PASS: 12534 / 12942
- FAIL: 408 / 12942
<!-- WPT_STATUS_END -->

## Features

- **Specification-Compliant**: Implementation matches the CSS Typed OM Level 1 spec.
- **Automatic Polyfilling**: Automatically patches `window.CSS`, `Element.prototype.computedStyleMap`, `HTMLElement.prototype.attributeStyleMap`, and other relevant interfaces if running in a browser.
- **Typed Values**: Supports `CSSUnitValue`, `CSSMathValue`, `CSSTransformValue`, `CSSColorValue`, and more.
- **Fully Typed**: Written in TypeScript with standard types exported.
- **ESM & IIFE Support**: Built for modern environments and direct browser script usage.
- **Fully WPT Tested**: This project is fully tested using the official [Web Platform Tests (WPT)](https://github.com/web-platform-tests/wpt).

## Installation

```bash
npm install typed-om-polyfill
```

## Usage

### 1. As a Polyfill

Simply import the package to automatically install the polyfill on the global scope:

```javascript
import 'typed-om-polyfill';

// Now you can use the typed OM API
const element = document.querySelector('.my-element');
const width = element.computedStyleMap().get('width');

console.log(width.value); // e.g., 100
console.log(width.unit);  // e.g., 'px'

// Setting styles
element.attributeStyleMap.set('opacity', CSS.number(0.5));
element.attributeStyleMap.set('margin-top', CSS.px(20));
```

### 2. As a Module (Explicit Imports)

If you prefer to use the classes directly without relying on global patching (or for testing/Node environments):

```javascript
import { CSSUnitValue, CSSKeywordValue } from 'typed-om-polyfill';

const width = new CSSUnitValue(100, 'px');
const display = new CSSKeywordValue('block');
```

## Development

### Installation

To install dependencies for development:

```bash
npm install
```

### Building

To build the project (ESM, IIFE, and Types):

```bash
npm run build
```

### Testing

To run all tests (unit and Web Platform Tests):

```bash
npm run test
```

Or you can run them individually:

1.  **Unit Tests**: Fast tests using Vitest.
    ```bash
    npm run test:unit
    ```

2.  **Web Platform Tests (WPT)**: Runs the official WPT suite for CSS Typed OM.
    ```bash
    # Run WPT tests (requires Python and Firefox)
    npm run test:wpt
    
    # Run WPT tests locally for debugging
    npm run test:wpt:local
    ```

## License

MIT

## Disclaimer

This project is mostly AI-generated using [Google Antigravity](https://antigravity.google/), based on the spec and WPT.