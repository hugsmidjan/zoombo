# Zoombo

Element pinch zoom and pan behaviour handler - supporting touch, mouse and
trackpad events.

```sh
yarn add --dev zoombo
```

**Contents:**

- [Basic usage:](#basic-usage)
- [Options (w/ defaults)](#options-w-defaults)
- [React Component](#react-component)
  - [Render-props version](#render-props-version)
  - [HOC version](#hoc-version)
- [Zoombo state](#zoombo-state)
- [Actions](#actions)
- [API](#api)

## Basic usage:

```js
import Zoombo from 'zoombo';
const figureElm = document.querySelector('.figure');

const myZoombo = Zoombo({
  refElm: figureElm,
  opts: {
    maxZoom: 10, // other options
  },
  onStart: (state) => {
    figureElm.classList.add('figure--is-dragging');
  },
  onChange: (state) => {
    figureElm.style.transform = state.cssTransform;
    // See chapter on zoombo state properties below...
  },
  onEnd: (state) => {
    figureElm.classList.remove('figure--is-dragging');
  },
});

myZoombo.start(); // bind DOM events
```

The returned instance object has a few useful methods...

```js
// Perform actions
myZoombo.actions.panTo(0.25, 0.6);
myZoombo.actions.zoomIn();
// etc...

// Inspect the current zoombo state...
const currentState = myZoombo.getState();

// Modify the options
myZoombo.updateOpts({ minZoom: 1 });

// Enable/Disable
myZoombo.stop(); // unbind DOM events

console.log(myZoombo.isActive()); // false

myZoombo.start(); // resume (re-bind events)

console.log(myZoombo.isActive()); // true

myZoombo.actions.reset();
```

## Options (w/ defaults)

```js
const options = {
  initialZoom: 1,
  initialX: 0.5,
  initialY: 0.5,
  maxZoom: 4,
  minZoom: 1,
  marginX: 0,
  marginY: 0,
  zoomStep: 2,
  panStep: 0.5,
  dragThreshold: 7, // px
  pinchThreshold: 30, // px
  oneFingerPan: false,
};
```

The values `panStep`, `initialX` and `initialY` are numbers from `0` to `1`
representing proportion of the provided reference element's
`offsetWidth`/`offsetHeight` values.

While `marginX` and `marginY` are any positive number representing proportion
of the provided reference element's `offsetWidth`/`offsetHeight` before
zooming.

## React Component

The optional React helper comes in two flavours:

### Render-props version

```jsx
import React from 'react';
import Zoombo from 'zoombo/react'; // esm version
// import Zoombo from 'zoombo/cjs/react'; // CommonJS version

const logState = (zoomboState) => {
  console.log('zoombo', zoomboState);
};

const MyFigureComponent = (props) => (
  <Zoombo
    maxZoom={4}
    initialZoom={2}
    onStart={logState}
    onChange={logState}
    onEnd={logState}
    disabled={false}
  >
    {(zoomboRef, zoombo /* , zoomboActions */) => (
      <div
        className={
          'figure' + (zoombo.isDragging ? ' figure--is-dragging' : '')
        }
        ref={zoomboRef}
        style={{ transform: zoombo.cssTransform }}
      >
        <img src={props.src} alt={props.altText} />
      </div>
    )}
  </Zoombo>
);

export default MyFigureComponent;
```

The `<Zoombo/>` component's props are passed directly on to the underlying
`Zoombo()` function – with the notable exception of `disabled` which acts as a
signal for activating the `.start()` and `.stop()` methods.

### HOC version

```jsx
import React from 'react';
import Zoombo from 'zoombo/react'; // esm version
// import Zoombo from 'zoombo/cjs/react'; // CommonJS version

const logState = (zoomboState) => {
  console.log('zoombo', zoomboState);
};

const MyFigureComponent = (props) => {
  const { zoomboRef, zoombo /* , zoomboActions */ } = props;
  return (
    <div
      className={'figure' + (zoombo.isDragging ? ' figure--is-dragging' : '')}
      ref={zoomboRef}
      style={{ transform: zoombo.cssTransform }}
    >
      <img src={props.src} alt={props.altText} />
    </div>
  );
};

export default Zoombo.withZoombo(MyFigureComponent, {
  maxZoom: 4,
  initialZoom: 2,
  onStart: logState,
  onChange: logState,
  onEnd: logState,
  disabled: false,
});
```

The second argument to the `Zoombo.withZoombo` HOC can also be a function:

```js
const propsToZoomboOpts = (props) => ({
  maxZoom: 4,
  initialZoom: 2,
  onStart: logState,
  onChange: logState,
  onEnd: logState,
  disabled: props.disabled,
});

export default Zoombo.withZoombo(MyFigureComponent, propsToZoomboOpts);
```

## Zoombo state

The Zoombo state exposed to the `onStart`, `onChange` and `onEnd` callbacks,
includes these basic props:

- **`zoom: number`** - The current zoom factor
- **`x: number`**, **`y: number`** - The current focal/center points (bounded
  by `zoom`, `opts.marginX` and `opts.marginY`)
- **`isDragging: boolean`** – Flag indicating if the user is currently
  dragging/pinching/etc.

The state also includes some precalculated CSS-friendly props:

- **`cssSize: number`** – Percentage for use for `width` and `height`
  (`100 * state.zoom`)
- **`cssTop: number`**, **`cssLeft: number`** – Percentage for CSS positioning
  (`-cssSize * state.{x|y} + 50`)
- **`cssTranslateX: number`**, **`cssTranslateY: number`** – Percentage for
  translation offsets (`-100 * state.{x|y} + 50`)
- **`cssTransform: string`** – Ready to use transformation string in the form
  of:
  `scale(${state.zoom}) translate3d(${cssTranslateX}%, ${cssTranslateY}%, 0)`,

## Actions

A `Zoombo` instance has the following `.actions` that can be used to hook up
UI buttons or add scripted behaviour to the zoombo element

- **`panN(numSteps)`**, **`panE(numSteps)`**, **`panS(numSteps)`**,
  **`panW(numSteps)`** Pans towards the given direction (N,S,E,W) by a factor
  of `numSteps * opts.panStep / currentZoom`
- **`panBy(xFactor, yFactor)`** Changes the pan by the given X and Y factors
  (scaled by the current zoom level).
- **`panTo(x?, y?)`** Pans directly to the given `x` and `y` coordinates,
  where `(0,0)` is top-left and `(1,1)` is bottom-right.
- **`zoomIn(numSteps, x?, y?)`** Zooms in by a factor of
  `numSteps * opts.zoomStep / currentZoom` towards an optional new `x`,`y`
  centerpoint
- **`zoomOut(numSteps, x?, y?)`** – Zooms out by a factor of
  `numSteps * opts.zoomStep / currentZoom` towards an optional new `x`,`y`
  centerpoint
- **`zoomBy(factor, x?, y?)`** – Changes the zoom-level by the given `factor`
  towards an optional new `x`,`y` centerpoint.
- **`zoomTo(zoom, x?, y?)`** Zooms directly to the given `zoom` level and
  (optionally) pan to `x` and `y`
- **`reset()`** Resets the zoom and pan back to initial values.

## API

...TODO...
