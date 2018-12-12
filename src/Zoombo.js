import { eventHandlers, actions, setZoomValues } from './Zoombo.privates';

const defaultOpts = {
  initialZoom: 1,
  initialX: 0.5,
  initialY: 0.5,
  maxZoom: 4,
  minZoom: 0.5,
  marginX: 0,
  marginY: 0,
  zoomStep: 2,
  panStep: 0.5,
  oneFingerPan: false,
  dragThreshold: 7,
  pinchThreshold: 30,
};

const Zoombo = (options) => {
  const _updateOpts = (newOpts) => {
    Object.keys(newOpts).forEach((option) => {
      if (option in opts && newOpts[option] !== undefined) {
        opts[option] = newOpts[option];
      }
    });
  };

  const opts = Zoombo.getDefaults();
  _updateOpts(options.opts);

  let _stateVersion = {};
  const setState = (key, val, silent) => {
    if (state[key] !== val) {
      state[key] = val;
      _stateVersion = silent ? _stateVersion : {};
    }
  };

  const state = {
    // zoom,
    // x,
    // y,
    // size,
    // top,
    // left,
    isDragging: false,
  };

  const getState = () => Object.assign({}, state);

  const eventMeta = {
    refElm: options.refElm,
    started: false,
  };

  const _onStart = options.onStart;
  const _onChange = options.onChange;
  const _onEnd = options.onEnd;
  let _lastStateVersion = _stateVersion;
  let _throttledOnChange;

  const innards = {
    state,
    opts,
    eventMeta,
    setState,
    onStart: () => {
      state.isDragging = true;
      _onStart && _onStart(getState());
    },
    onChange: () => {
      clearTimeout(_throttledOnChange);
      _throttledOnChange = setTimeout(() => {
        if (_stateVersion !== _lastStateVersion) {
          _onChange(getState());
          _lastStateVersion = _stateVersion;
        }
      }, 0);
    },
    onEnd: () => {
      state.isDragging = false;
      _onEnd && _onEnd(getState());
    },
  };
  innards.actions = Object.keys(actions).reduce((acc, action) => {
    acc[action] = actions[action].bind(innards);
    return acc;
  }, {});

  const events = Object.keys(eventHandlers).reduce((acc, event) => {
    acc[event] = eventHandlers[event].bind(innards);
    return acc;
  }, {});

  setZoomValues.call(innards, opts.initialZoom, opts.initialX, opts.initialY, true);

  let started = false;
  const instance = {
    actions: innards.actions,
    getState,

    start(refElm) {
      if (!started) {
        refElm = refElm || eventMeta.refElm;
        if (refElm) {
          eventMeta.refElm = refElm;
          refElm.addEventListener('click', events.click, true);
          refElm.addEventListener('wheel', events.wheel, true);
          refElm.addEventListener('mousedown', events.touchStart, true);
          refElm.addEventListener('touchstart', events.touchStart, true);
          document.addEventListener('mousemove', events.touchMove, true);
          document.addEventListener('touchmove', events.touchMove, true);
          document.addEventListener('mouseup', events.touchEnd, true);
          document.addEventListener('touchend', events.touchEnd, true);
          // document.addEventListener('mouseleave', events.mouseLeave, true);
          // document.addEventListener('mouseenter', events.mouseEnter, true);
          started = true;
        } else {
          throw Error('Zoombo element is missing');
        }
      }
    },
    stop() {
      if (started) {
        const refElm = eventMeta.refElm;
        refElm.removeEventListener('click', events.click, true);
        refElm.removeEventListener('wheel', events.wheel, true);
        refElm.removeEventListener('mousedown', events.touchStart, true);
        refElm.removeEventListener('touchstart', events.touchStart, true);
        document.removeEventListener('mousemove', events.touchMove, true);
        document.removeEventListener('touchmove', events.touchMove, true);
        document.removeEventListener('mouseup', events.touchEnd, true);
        document.removeEventListener('touchend', events.touchEnd, true);
        // document.removeEventListener('mouseleave', events.mouseLeave, true);
        // document.removeEventListener('mouseenter', events.mouseEnter, true);
        events.touchEnd();
        started = false;
      }
    },

    updateOpts(newOpts) {
      const wasZoomPristine = state.zoom === opts.initialZoom;
      _updateOpts(newOpts);
      innards.actions.zoomTo(
        wasZoomPristine ? opts.initialZoom : state.zoom,
        state.x,
        state.y
      );
    },

    isActive() {
      return started;
    },
  };

  return instance;
};

Zoombo.getDefaults = () => Object.assign({}, defaultOpts);

export default Zoombo;
