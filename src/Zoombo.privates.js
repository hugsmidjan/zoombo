export const eventHandlers = {
  touchStart(e) {
    const opts = this.opts;
    const basicTouch = !e.button; // no button (null) or primary button (0)
    if (basicTouch && (opts.oneFingerPan || !e.touches || e.touches.length === 2)) {
      e && e.preventDefault();

      const touches = e.touches || [e];
      const meta = this.eventMeta;
      meta.startX = touches[0].clientX;
      meta.startY = touches[0].clientY;
      if (touches[1]) {
        meta.isDragMultiTouch = true;
        meta.startX2 = touches[1].clientX;
        meta.startY2 = touches[1].clientY;
        const startSpaceX = meta.startX - meta.startX2;
        const startSpaceY = meta.startY - meta.startY2;
        meta.startFingerSpace = Math.sqrt(
          startSpaceX * startSpaceX + startSpaceY * startSpaceY
        );
      }
      const state = this.state;
      meta.referenceZoom = state.zoom;
      meta.referenceX = state.x;
      meta.referenceY = state.y;

      meta.isTouching = true;
    }
  },

  touchMove(e) {
    const meta = this.eventMeta;
    if (meta.isTouching) {
      const opts = this.opts;
      const touches = e.touches || [e];
      const xPos = touches[0].clientX;
      const yPos = touches[0].clientY;
      const xOffs = meta.startX - xPos;
      const yOffs = meta.startY - yPos;
      const wasDragged = meta.isDragging;
      if (!wasDragged) {
        meta.isDragging =
          xOffs * xOffs + yOffs * yOffs > opts.dragThreshold * opts.dragThreshold;
      }

      let zoomDelta = 1;
      let xDelta = xOffs;
      let yDelta = yOffs;
      if (meta.isDragMultiTouch) {
        const xPos2 = touches[1].clientX;
        const yPos2 = touches[1].clientY;
        xDelta = (xOffs + meta.startX2 - xPos2) / 2;
        yDelta = (yOffs + meta.startY2 - yPos2) / 2;
        const spaceX = xPos - xPos2;
        const spaceY = yPos - yPos2;
        const fingerSpace = Math.sqrt(spaceX * spaceX + spaceY * spaceY);
        if (!meta.isZooming) {
          meta.isZooming =
            Math.abs(fingerSpace - meta.startFingerSpace) > opts.pinchThreshold;
          // Beacause zoom is a type of drag
          meta.isDragging = meta.isDragging || meta.isZooming;
        }
        if (meta.isZooming) {
          zoomDelta =
            (fingerSpace - 0.5 * (fingerSpace - meta.startFingerSpace)) /
            meta.startFingerSpace;
          // Slower version:
          // zoomDelta = Math.pow(fingerSpace/meta.startFingerSpace, 0.5);
        }
      }
      if (meta.isDragging) {
        e && e.stopPropagation();
        e && e.preventDefault();

        if (!wasDragged) {
          this.onStart();
        }
        const elmSize =
          xDelta || yDelta
            ? meta.refElm.getBoundingClientRect()
            : { width: 0, height: 0 };
        this.actions.zoomTo(
          zoomDelta * meta.referenceZoom,
          xDelta / elmSize.width + meta.referenceX,
          yDelta / elmSize.height + meta.referenceY
        );
      }
    }
  },

  touchEnd(e) {
    const meta = this.eventMeta;
    if (meta.isTouching) {
      e && e.stopPropagation();
      e && e.preventDefault();

      meta.isTouching = meta.isZooming = false;
      meta.startX = meta.startY = meta.startX2 = meta.startY2 = undefined;
      meta.referenceZoom = meta.referenceX = meta.referenceY = undefined;
      meta.startFingerSpace = meta.isDragMultiTouch = undefined;

      if (meta.isDragging) {
        // Use timeout in order to prevent non-drag-related click events
        // from making incorrect assumptions about this mouseup/touchend event
        setTimeout(() => {
          meta.isDragging = false;
          this.onEnd();
        }, 100);
      }
    }
  },

  click(e) {
    if (this.eventMeta.isDragging) {
      e.stopPropagation();
      e.preventDefault();
    }
  },

  wheel(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      this.actions.zoomBy(1 - e.deltaY * 0.005);
    }
  },

  // mouseLeave(/*e*/) {
  //   if (this.eventMeta.isDragging) {
  //     this.eventMeta.delayedDragActionEnd = setTimeout(
  //       () => eventHandlers.touchEnd.call(this),
  //       500
  //     );
  //   }
  // },
  // mouseEnter(/*e*/) {
  //   if (this.eventMeta.isDragging) {
  //     clearTimeout(this.eventMeta.delayedDragActionEnd);
  //   }
  // },
};

export function setZoomValues(zoom, x, y, slient) {
  const setState = this.setState;
  const state = this.state;
  const opts = this.opts;
  if (zoom != null) {
    const newZoom = Math.max(opts.minZoom, Math.min(opts.maxZoom, zoom));
    !isNaN(newZoom) && setState('zoom', newZoom, slient);
  }
  if (x != null || zoom != null) {
    const marginX = Math.min(0.5, (0.5 - opts.marginX) / state.zoom);
    x = x != null ? x : state.x;
    x = Math.max(marginX, Math.min(1 - marginX, x));
    !isNaN(x) && setState('x', x, slient);
  }
  if (y != null || zoom != null) {
    const marginY = Math.min(0.5, (0.5 - opts.marginY) / state.zoom);
    y = y != null ? y : state.y;
    y = Math.max(marginY, Math.min(1 - marginY, y));
    !isNaN(y) && setState('y', y, slient);
  }
}

export const actions = {
  panN(numSteps) {
    const factor = (numSteps || 1) * this.opts.panStep;
    actions.panBy.call(this, 0, -factor);
  },
  panE(numSteps) {
    const factor = (numSteps || 1) * this.opts.panStep;
    actions.panBy.call(this, factor, 0);
  },
  panS(numSteps) {
    const factor = (numSteps || 1) * this.opts.panStep;
    actions.panBy.call(this, 0, factor);
  },
  panW(numSteps) {
    const factor = (numSteps || 1) * this.opts.panStep;
    actions.panBy.call(this, -factor, 0);
  },

  panBy(xFactor, yFactor) {
    const state = this.state;
    const newX = state.x + xFactor / state.zoom;
    const newY = state.y + yFactor / state.zoom;
    actions.zoomTo.call(this, null, newX, newY);
  },

  panTo(x, y) {
    actions.zoomTo.call(this, null, x, y);
  },

  zoomIn(numSteps, x, y) {
    const factor = (numSteps || 1) * this.opts.zoomStep;
    actions.zoomBy.call(this, factor, x, y);
  },

  zoomOut(numSteps, x, y) {
    const factor = (numSteps || 1) * this.opts.zoomStep;
    actions.zoomBy.call(this, 1 / factor, x, y);
  },

  zoomBy(factor, x, y) {
    const newZoom = Math.abs(factor) * this.state.zoom;
    actions.zoomTo.call(this, newZoom, x, y);
  },

  zoomTo(zoomLevel, x, y) {
    setZoomValues.call(this, zoomLevel, x, y);
    this.onChange();
  },

  reset() {
    const opts = this.opts;
    actions.zoomTo.call(this, opts.initialZoom, opts.initialX, opts.initialY);
  },
};
