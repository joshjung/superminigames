import React from 'react';

import {RingaComponent} from 'ringa-fw-react';

import GraphicRenderer from '../../core/GraphicRenderer';

import './GameCanvas.scss';

class GameCanvasRenderer extends GraphicRenderer {
  resizeHandler() {
    super.resizeHandler();

    const canvasScreenWidth = this.canvas.clientWidth;
    const canvasPixelWidth = this.canvas.width;
    const canvasPixelHeight = this.canvas.height;
    const widthHeightRatio = canvasPixelHeight / canvasPixelWidth;
    const targetCanvasScreenHeight = canvasScreenWidth * widthHeightRatio;

    this.canvas.style.height = `${targetCanvasScreenHeight}px`;
  }
}

export default class Canvas extends RingaComponent {
  //-----------------------------------
  // Constructor
  //-----------------------------------
  constructor(props) {
    super(props);
  }

  //-----------------------------------
  // Lifecycle
  //-----------------------------------
  componentDidMount() {
    this.renderer = new GameCanvasRenderer(this.refs.canvas, {
      debug: false,
      canvasAutoClear: true,
      resetPixelSizeToCanvas: false,
      heightToWidthRatio: 600 / 800
    });

    if (this.props.game && this.props.game.gameContainer) {
      this.addGameContainer(this.props.game.gameContainer);
    }
  }

  componentWillUpdate(nextProps) {
    console.log('UPDATING');
    if (nextProps.game && nextProps.game.gameContainer) {
      this.addGameContainer(nextProps.game.gameContainer);
    }
  }

  render() {
    return <div className="canvas">
      <canvas ref="canvas" />
    </div>;
  }

  //-----------------------------------
  // Methods
  //-----------------------------------
  addGameContainer(gameContainer) {
    if (gameContainer === this.curGameContainer) {
      return;
    }

    if (this.curGameContainer) {
      this.renderer.removeChild(this.curGameContainer);
    }

    this.renderer.addChild(gameContainer);

    this.curGameContainer = gameContainer;
  }
}
