import React from 'react';
import Zoombo from './Zoombo';

const zoomboOptsChanged = (newProps, oldProps) =>
  newProps.initialZoom !== oldProps.initialZoom ||
  newProps.initialX !== oldProps.initialX ||
  newProps.initialY !== oldProps.initialY ||
  newProps.maxZoom !== oldProps.maxZoom ||
  newProps.minZoom !== oldProps.minZoom ||
  newProps.marginX !== oldProps.marginX ||
  newProps.marginY !== oldProps.marginY ||
  newProps.zoomStep !== oldProps.zoomStep ||
  newProps.panStep !== oldProps.panStep ||
  newProps.oneFingerPan !== oldProps.oneFingerPan ||
  newProps.dragThreshold !== oldProps.dragThreshold ||
  newProps.pinchThreshold !== oldProps.pinchThreshold;

export default class ZoomboComponent extends React.Component {
  constructor(props) {
    super(props);

    this.elementRef = (elm) => {
      this.refElm = elm;
    };

    this.zoombo = this.makeZoombo(props);

    this.state = this.zoombo.getState();
  }

  makeZoombo(props) {
    // Tolerate JSX string props where numbers are expected
    const opts = Object.keys(props).reduce((acc, name) => {
      const propValue = props[name];
      acc[name] = typeof propValue !== 'string' ? propValue : parseInt(propValue) || 0;
      return acc;
    }, {});

    return Zoombo({
      opts,
      refElm: this.refElm,
      onChange: (zoomboState) => {
        this.setState(zoomboState, props.onChange && (() => props.onChange(this.state)));
      },
      onEnd: (zoomboState) => {
        this.setState(zoomboState, props.onEnd && (() => props.onEnd(this.state)));
      },
      onStart: (zoomboState) => {
        this.setState(zoomboState, props.onStart && (() => props.onStart(this.state)));
      },
    });
  }

  componentDidMount() {
    if (!this.props.disabled) {
      this.zoombo.start(this.refElm);
    }
  }
  componentWillUnmount() {
    this.zoombo.stop();
  }

  componentDidUpdate(oldProps) {
    const newProps = this.props;
    const disabled = newProps.disabled;
    if (!!disabled !== !!oldProps.disabled) {
      if (disabled) {
        this.zoombo.start(this.refElm);
      } else {
        this.zoombo.stop();
      }
    }
    if (zoomboOptsChanged(newProps, oldProps)) {
      this.zoombo.updateOpts(newProps);
    }
  }

  render() {
    const { render, children } = this.props;
    return (render || children)(this.elementRef, this.state, this.zoombo.actions);
  }
}

ZoomboComponent.withZoombo = (Container, opts) => {
  const dynamicOpts = typeof opts === 'function';

  return (props) => {
    const zoomboOpts = dynamicOpts ? opts(props) : opts;
    return (
      <ZoomboComponent {...zoomboOpts}>
        {(elementRef, state, actions) => (
          <Container
            {...props}
            zoombo={state}
            zoomboActions={actions}
            zoomboRef={elementRef}
          />
        )}
      </ZoomboComponent>
    );
  };
};
