import React from 'react';

import {RingaComponent} from 'ringa-fw-react';

import Keyboard from './Keyboard';

import './MobileInputController.scss';

export default class MobileInputController extends RingaComponent {
  //-----------------------------------
  // Constructor
  //-----------------------------------
  constructor(props) {
    super(props);

    if (props.game) {
      this.watchGame(props.game);
    }
  }

  //-----------------------------------
  // Lifecycle
  //-----------------------------------
  componentWillUnmount() {
    super.componentWillUnmount();

    this.props.game.unwatch(this.game_signalHandler);
  }

  render() {
    const {game} = this.props;

    if (!game.listeningKeys) {
      return <span />;
    }

    let fixedDirectionalPad = undefined;
    let actionPad = undefined;

    let up, down, right, left;

    this.lastListeningKeys = Object.assign({}, game.listeningKeys);

    up = game.listeningKeys[Keyboard.KEY_CODES.UP];
    down = game.listeningKeys[Keyboard.KEY_CODES.DOWN];
    left = game.listeningKeys[Keyboard.KEY_CODES.LEFT];
    right = game.listeningKeys[Keyboard.KEY_CODES.RIGHT];

    if (up || down || left || right) {
      fixedDirectionalPad = <div className="fixed-directional-pad">
        {up ? <button className="up"
                      onMouseDown={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.UP)}
                      onTouchStart={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.UP)}
                      onMouseUp={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.UP)}
                      onTouchEnd={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.UP)}>
          <i className="fa fa-arrow-up" />
        </button> : this.clear(Keyboard.KEY_CODES.UP)}
        {left ? <button className="left"
                        onMouseDown={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.LEFT)}
                        onTouchStart={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.LEFT)}
                        onMouseUp={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.LEFT)}
                        onTouchEnd={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.LEFT)}>
          <i className="fa fa-arrow-left" />
        </button> : this.clear(Keyboard.KEY_CODES.LEFT)}
        {right ? <button className="right"
                         onMouseDown={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.RIGHT)}
                         onTouchStart={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.RIGHT)}
                         onMouseUp={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.RIGHT)}
                         onTouchEnd={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.RIGHT)}>
          <i className="fa fa-arrow-right" />
        </button> : this.clear(Keyboard.KEY_CODES.RIGHT)}
        {down ? <button className="down"
                        onMouseDown={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.DOWN)}
                        onTouchStart={this.button_mouseDownHandler.bind(this, Keyboard.KEY_CODES.DOWN)}
                        onMouseUp={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.DOWN)}
                        onTouchEnd={this.button_mouseUpHandler.bind(this, Keyboard.KEY_CODES.DOWN)}>
          <i className="fa fa-arrow-down" />
        </button> : this.clear(Keyboard.KEY_CODES.DOWN)}
      </div>;
    } else {
      // If we rerender and erase the buttons ,there is no chance to listen for a mouse up! This means that
      // we have to clear those key codes.
      this.clear(Keyboard.KEY_CODES.UP);
      this.clear(Keyboard.KEY_CODES.LEFT);
      this.clear(Keyboard.KEY_CODES.RIGHT);
      this.clear(Keyboard.KEY_CODES.DOWN);
    }

    const upLeftRightDown = [Keyboard.KEY_CODES.UP, Keyboard.KEY_CODES.LEFT, Keyboard.KEY_CODES.RIGHT, Keyboard.KEY_CODES.DOWN];
    const otherKeyCodes = Object.keys(game.listeningKeys).filter(kc => upLeftRightDown.indexOf(parseInt(kc)) === -1);

    this.oldWatchingKeys = this.watchingKeys;
    this.watchingKeys = {};

    if (otherKeyCodes.length) {
      actionPad = <div className="action-pad">{otherKeyCodes.map(kc => {
        this.watchingKeys[kc] = true;

        const action = this.props.game.keyboard.keyActionNames[parseInt(kc)] || Keyboard.KEY_CODE_NAMES[parseInt(kc)];

        const style = {};

        if (this.props.game.keyboard.keyColors[parseInt(kc)]) {
          style.background = this.props.game.keyboard.keyColors[parseInt(kc)];
        }

        return <button key={`key${kc}`}
                       className="key"
                       style={style}
                       onMouseDown={this.button_mouseDownHandler.bind(this, parseInt(kc))}
                       onTouchStart={this.button_mouseDownHandler.bind(this, parseInt(kc))}
                       onMouseUp={this.button_mouseUpHandler.bind(this, parseInt(kc))}
                       onTouchEnd={this.button_mouseUpHandler.bind(this, parseInt(kc))}>{action}</button>;
      })}</div>;
    }

    // Clear out all old buttons that were available before but are no longer visible now, in case the user
    // had their mouse down on one of them.
    for (let kc in this.oldWatchingKeys) {
      if (!this.watchingKeys[parseInt(kc)]) {
        this.clear(kc);
      }
    }

    return <div className="mobile-input-controller">
      {fixedDirectionalPad}
      {actionPad}
    </div>;
  }

  //-----------------------------------
  // Methods
  //-----------------------------------
  watchGame(game) {
    game.watch(this.game_signalHandler);
  }

  clear(keyCode) {
    if (!this.props.game.paused) {
      this.props.game.keyboard.release(keyCode);
    }
  }

  //-----------------------------------
  // Events
  //-----------------------------------
  game_signalHandler(signal) {
    if (signal === 'listeningKeys' || signal === 'paused') {
      const lastKeys = JSON.stringify(this.lastListeningKeys);
      const nextKeys = JSON.stringify(this.props.game.listeningKeys);

      if (lastKeys !== nextKeys) {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
          if (this.mounted) {
            this.forceUpdate();
          }
        }, 10);
      }
    }
  }

  button_mouseDownHandler(keyCode) {
    if (!this.props.game.paused) {
      this.props.game.keyboard.press(keyCode);
    }
  }

  button_mouseUpHandler(keyCode) {
    if (!this.props.game.paused) {
      this.props.game.keyboard.release(keyCode);
    }
  }
}
