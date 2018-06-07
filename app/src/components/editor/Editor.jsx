import React from 'react';

import {RingaComponent, TextInput, Button, TabNavigator, Tab, Alert, Markdown, I18NModel, List, ModalToggleContainer, Dropdown} from 'ringa-fw-react';
import {dependency} from 'react-ringa';
import GameController from '../../controllers/GameController';
import APIController from '../../controllers/APIController';
import AppModel from '../../models/AppModel';
import history from '../../global/history';
import GameCanvas from '../game/GameCanvas';
import Highscores from '../../components/Highscores';
import moment from 'moment';
import * as JsDiff from 'diff';
import classnames from 'classnames';

import AceEditor from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/github';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';

import './Editor.scss';

export default class Editor extends RingaComponent {
  //-----------------------------------
  // Constructor
  //-----------------------------------
  constructor(props) {
    super(props);

    this.state = {
      code: '',
      instructions: 'Enter your instructions using Markdown syntax',
      description: '',
      title: '',
      showHistory: false,
      selectedHistoryItem: undefined
    };

    this.diffMap = {};

    this.depend(dependency(AppModel, ['user']), dependency(I18NModel, 'language'));

    // TODO figure out a better way to keep the buttons from being focused
    document.addEventListener('click', function(e) {
      if(document.activeElement.toString() == '[object HTMLButtonElement]') {
        const tabindex = document.activeElement.getAttribute('tabindex');

        if (parseInt(tabindex) === -1) {
          document.activeElement.blur();
        }
      }
    });

    if (this.props.game) {
      this.state.code = this.props.game.gameLoopFnText;
      this.state.instructions = this.props.game.instructions;
      this.state.description = this.props.game.description;
      document.title = this.state.title = this.props.game.title;

      this.props.game.watch(signal => {
        if (['syntaxError', 'runError', 'published', 'dirty'].indexOf(signal) !== -1) {
          this.forceUpdate();
        }
      })
    }
  }

  updateCurGameHistory() {
    const {code} = this.state;
    const history = this.props.game.sortedHistory.concat();

    history.forEach(h => h.current = false);

    if (history && history.length && code !== history[0].gameLoopFnText) {
      history.unshift({
        gameLoopFnText: code,
        timestamp: new Date().getTime(),
        version: '"Unsaved"',
        diff: JsDiff.diffChars(history[0].gameLoopFnText, code),
        current: true
      });
    } else {
      history[0].current = true;
    }

    this.history = history;
  }

  //-----------------------------------
  // Lifecycle
  //-----------------------------------
  componentWillUpdate(nextProps) {
    if (nextProps.game !== this.props.game) {
      document.title = nextProps.game ? nextProps.game.title : 'Game Editor';
      this.setState({
        code: nextProps.game ? nextProps.game.gameLoopFnText : '',
        instructions: nextProps.game ? nextProps.game.instructions : '',
        title: nextProps.game ? nextProps.game.title : '',
        description: nextProps.game ? nextProps.game.description : ''
      });
    }
  }

  renderControls() {
    const {showHistory, fullScreenEditor} = this.state;
    return <span className="controls">
      <Button onClick={this.save_onClickHandler} focusable={false} tabindex={-1} classes={this.props.game.dirty ? 'highlight' : undefined}>
        <i className="fa fa-save"></i>
      </Button>
      <Button onClick={this.reset_onClickHandler} focusable={false} tabindex={-1}>
        <i className="fa fa-step-backward" />
      </Button>
      <Button onClick={this.pausePlay_onClickHandler} focusable={false} tabindex={-1}>
        {this.props.game.paused ? <i className="fa fa-play" /> : <i className="fa fa-pause" />}
      </Button>
      <Button onClick={this.fullScreenEditor_onClickHandler} selected={fullScreenEditor} focusable={false} tabindex={-1}>
        {fullScreenEditor ? <i className="fa fa-window-restore" /> : <i className="fa fa-window-maximize" />}
      </Button>
      <Button onClick={this.history_onChangeHandler} selected={showHistory} focusable={false} tabindex={-1}>
        <i className="fa fa-history" />
      </Button>
      {this.props.game.dirty && <span className="dirty">Unsaved</span>}
    </span>;
  }

  renderInstructions() {
    const {instructions, user, fullScreenEditor} = this.state;
    const {ownerUserId} = this.props.game;

    const ta = <textarea onChange={this.instructions_onChangeHandler} value={instructions} wrap="soft" />;
    const preview = <Markdown markdown={instructions}/>;

    if (fullScreenEditor) {
      return <div className="full-screen-instructions">
        <div className="edit">{ta}</div>
        <div className="preview">{preview}</div>
      </div>;
    }

    return user && user.id === ownerUserId ? <TabNavigator>
      <Tab label="Edit">
        {ta}
      </Tab>
      <Tab label="Preview">
        {preview}
      </Tab>
    </TabNavigator> : <Markdown markdown={instructions}/>;
  }

  renderHistory() {
    const {showHistory, selectedHistoryItem} = this.state;
    const history = this.history;
    const modalContents = showHistory && [<div className="left-pane">
      {!history.length ? 'No history available yet' : <List items={history}
                                                            value={selectedHistoryItem}
                                                            indexFunction={item => item.timestamp.toString()}
                                                            labelField="timestamp"
                                                            enableSearch={false}
                                                            onChange={this.historyItem_onChangeHandler}
                                                            itemRenderer={this.renderHistoryItem}/>}
      </div>,
      this.renderHistoryDiff()
    ];

    return <ModalToggleContainer show={showHistory}
                                 width={700}
                                 height={600}
                                 updateTrigger={selectedHistoryItem}
                                 onClose={() => this.setState({showHistory: false})}
                                 title={`${this.props.game.title} Code History`}
                                 classes="history-item-modal"
                                 position="centered">
        {modalContents}
      </ModalToggleContainer>;
  }

  renderHistoryDiff() {
    const {selectedHistoryItem, compareHistoryItem} = this.state;

    if (!selectedHistoryItem) {
      return <div>No history item selected.</div>;
    }

    let diffKey = compareHistoryItem ? `${selectedHistoryItem.version}-${compareHistoryItem.version}` : `${selectedHistoryItem.version}-present`;

    let diff = this.diffMap[diffKey] ||
      (this.diffMap[diffKey] = compareHistoryItem ?
        JsDiff.diffChars(selectedHistoryItem.gameLoopFnText, compareHistoryItem.gameLoopFnText) :
        selectedHistoryItem.diff);

    diff = diff.slice(0, 50);

    const rendered = diff.map(d => {
      if (d.added) {
        return <span className="added">{d.value}</span>;
      }
      if (d.removed) {
        return <span className="removed">{d.value}</span>;
      }
      return <span style={{color: 'black'}}>{d.value}</span>;
    });

    const history = this.history;

    return <div className="right-pane">
        <div className="controls">
          <div>Compare <strong>Version {selectedHistoryItem.version}</strong> to</div>
          <Dropdown items={history}
                    onChange={this.compareHistoryItem_onChangeHandler}
                    labelFunction={item => `Version ${item.version ? item.version : history[1].version} ${item.current ? '(Current Code)' : ''}`}
                    value={compareHistoryItem || {version: selectedHistoryItem.version - 1}}/>
        </div>
        <div className="diff">
          <div className="code">
            <pre>
              <code>{rendered}</code>
            </pre>
          </div>
          <div className="bottom-controls">
            <Button onClick={this.restore_onClickHandler.bind(this, selectedHistoryItem)}
                    label={`Restore Version ${selectedHistoryItem.version}`}
                    classes="green"
                    enabled={!selectedHistoryItem.current}/>
          </div>
        </div>
      </div>;
  }

  renderHistoryItem(itemClickHandler, history) {
    const adds = (history.diff || []).filter(d => d.added).length;
    const deletes = (history.diff || []).filter(d => d.removed).length;
    const cn = classnames('item-renderer history-item', {
      selected: history === this.state.selectedHistoryItem
    });
    return <div className={cn}
                onClick={itemClickHandler}
                key={history.timestamp}>
      <div className="version">Version {history.version}</div>
      <div className="size">{history.gameLoopFnText.length} bytes</div>
      <div className="date">{moment(history.timestamp).fromNow()}</div>
      <div className="adds-cell">
        <div className={`adds ${adds && 'at-least-one'}`}>+{adds}</div>
      </div>
      <div className="deletes-cell">
        <div className={`deletes ${deletes && 'at-least-one'}`}>-{deletes}</div>
      </div>
    </div>;
  }

  renderEditor() {
    const {code, user, showHistory} = this.state;
    const {owner, syntaxError, runError, ownerUserId} = this.props.game;

    return <Tab label="Code" classes="code">
        {(!user || user.id !== ownerUserId) && <div className="code-note">This code belongs to {owner.name}. You are in playground mode and can change the code as much as you like and press Commit Code to see the changes. Login to duplicate this game to your account!</div>}
        {(user && user.id !== ownerUserId) && <div className="code-note">You can copy this game to your account by clicking Duplicate above.</div>}
        {this.renderHistory()}
        <AceEditor mode="javascript"
                   theme="github"
                   value={code}
                   width="100%"
                   height="100%"
                   onChange={this.code_onChangeHandler}
                   showPrintMargin={false}
                   highlightActiveLine={true}
                   enableBasicAutocompletion={true}
                   editorProps={{$blockScrolling: Infinity}}
                   setOptions={{
                     enableBasicAutocompletion: true,
                     enableLiveAutocompletion: true,
                     enableSnippets: true,
                     showLineNumbers: true,
                     tabSize: 2
                   }}
                   name="ace-editor" />
        <div className="errors">
          {syntaxError && <div className="error">Syntax Error: {syntaxError.toString()}</div>}
          {runError && <div className="error">Run Error: {runError.toString()}</div>}
        </div>
      </Tab>;
  }

  renderHeader() {
    const {title, code, user, fullScreenEditor} = this.state;
    const {image, owner, published, dirty} = this.props.game;
    const codeLength = code ? code.length : 0;

    if (fullScreenEditor) {
      return null;
    }

    return <div className="header">
      <div className="title-container">
        {image && <div><img className="game-image-small" src={image} /></div>}
        <h1>Editing {title} {dirty ? '*' : ''}</h1>
      </div>
      <h3>Author: {owner.name}, {codeLength} bytes {published ? <span className="published-card">Published</span> : <span className="unpublished-card">Unpublished</span> }</h3>
      <div className="actions">
        {(user && user.id !== this.props.game.ownerUserId) && <Button label="Duplicate to my account" onClick={this.duplicate_clickHandler} focusable={false} tabindex={-1} />}
        {published && <Button label="Play Published Game" onClick={this.playPublished_onClickHandler} focusable={false} tabindex={-1} />}
      </div>
    </div>;
  }

  render() {
    const {title, code, user, i18NModel, fullScreenEditor} = this.state;
    const {image, owner, published, ownerUserId, publishedDate, description, dirty} = this.props.game;
    const codeLength = code ? code.length : 0;

    return <div className="editor page">
      {this.renderHeader()}
      <div className="workspace">
        <div className={fullScreenEditor ? 'left-pane full-screen' : 'left-pane'}>
          <TabNavigator controls={this.renderControls()}>
            {this.renderEditor()}
            <Tab label="Instructions" classes="instructions">
              {this.renderInstructions()}
            </Tab>
            <Tab label="Settings" visible={!!(user && (user.id === ownerUserId))}>
              Title: <TextInput defaultValue={title} onChange={this.title_onChangeHandler} />
              Description: <TextInput multiline defaultValue={description} onChange={this.description_onChangeHandler} />
              {published ?
                <h3 className="published">Your game is live! It was published {moment(publishedDate).fromNow()}.</h3> :
                <h3 className="unpublished">Your game is not live.</h3>
              }
              <Button label="Publish Latest Changes" onClick={this.publish_onClickHandler} />
              {published && <Button label="Unpublish" onClick={this.unpublish_onClickHandler} />}
              <div className="screenshot">
                <h3>Screenshot <Button label="Take New Screenshot" onClick={this.screenshot_onClickHandler} /></h3>
                <div>Taking a screenshot records the current contents of the canvas on the right. Use Pause and Resume to get the
                perfect picture.</div>
                {image ? <img src={image} /> : 'No screenshot yet'}
              </div>
            </Tab>
            <Tab label="Highscores">
              <Button label="Clear Highscores" onClick={this.clearHighscores_onClickHandler} />
              <Highscores game={this.props.game} />
            </Tab>
            <Tab label="API">
              <Markdown markdown={i18NModel.i18n('api')}/>
            </Tab>
          </TabNavigator>
        </div>
        {!fullScreenEditor && <div className="right-pane">
          <GameCanvas game={this.props.game}/>
        </div>}
      </div>
    </div>;
  }

  saveGame() {
    const {game} = this.props;

    if (!game.ownerUserId) {
      game.ownerUserId = this.state.user.id;
    }

    game.title = this.state.title;
    game.instructions = this.state.instructions;
    game.description = this.state.description;

    const body = game.serialize();

    if (!game.id) {
      delete body.id;
    }

    this.dispatch(APIController.SAVE_GAME, {
      body
    }).then($lastPromiseResult => {
      this.props.game.dirty = false;

      this.props.game.history = $lastPromiseResult.history;

      history.push(`/games/playground/${$lastPromiseResult.id}`);

      this.forceUpdate();
    });
  }

  //-----------------------------------
  // Events
  //-----------------------------------
  save_onClickHandler(event) {
    this.dispatch(GameController.SET_LOOP_FN, {
      gameLoopFn: this.state.code
    }).then(success => {
      if (success) {
        this.saveGame();
      }
    });
  }

  pausePlay_onClickHandler() {
    this.props.game.paused = !this.props.game.paused;

    this.forceUpdate();
  }

  reset_onClickHandler() {
    this.props.game.reset();

    this.forceUpdate();
  }

  code_onChangeHandler(code, event) {
    this.props.game.dirty = true;

    this.setState({code});
  }

  instructions_onChangeHandler(event) {
    this.props.game.dirty = true;

    this.setState({
      instructions: event.target.value
    });
  }

  description_onChangeHandler(event) {
    this.props.game.dirty = true;

    this.setState({
      description: event.target.value
    });
  }

  title_onChangeHandler(event) {
    this.props.game.dirty = true;

    this.setState({
      title: event.target.value
    });
  }

  duplicate_clickHandler() {
    const {game} = this.props;

    Alert.show(`Do you want to completely copy ${game.title} into your account?`, Alert.YES_NO, {}, this.rootDomNode).then(result => {
      if (result.id === 'yes') {
        this.dispatch(APIController.CLONE_GAME, {
          id: game.id
        }).then($lastPromiseResult => {
          if ($lastPromiseResult._id) {
            history.push(`/games/playground/${$lastPromiseResult._id}`);
          } else {
            console.error('An error occurred', $lastPromiseResult);
          }
        });
      }
    })
  }

  publish_onClickHandler() {
    const {game} = this.props;

    Alert.show('Are you ready to publish your game? You can still edit your game after publishing and your changes will not go live until you publish again.', Alert.YES_NO, {}, this.rootDomNode).then(result => {
      if (result.id === 'yes') {
        game.publish();

        this.saveGame();
      }
    });
  }

  unpublish_onClickHandler() {
    const {game} = this.props;

    Alert.show('Are you sure you want to remove your game from being live? People can still play it with a direct link, but they will not be able to find it in explore.', Alert.YES_NO, {}, this.rootDomNode).then(result => {
      if (result.id === 'yes') {
        game.unpublish();

        this.saveGame();
      }
    });
  }

  playPublished_onClickHandler() {
    const {game} = this.props;

    history.push(`/games/play/${game.id}`);
  }

  screenshot_onClickHandler() {
    const {game} = this.props;

    game.image = game.screenshot();

    this.forceUpdate();
  }

  clearHighscores_onClickHandler() {
    const {game} = this.props;

    Alert.show(`Are you sure you want to clear all the highscores for this game?`, Alert.YES_NO, {}, this.rootDomNode).then(result => {
      if (result.id === 'yes') {
        this.dispatch(APIController.CLEAR_HIGHSCORES, {
          id: game.id
        }).then($lastPromiseResult => {
          if ($lastPromiseResult.success) {
            game.highscores = [];
            this.forceUpdate();
          }
        });
      }
    })
  }

  fullScreenEditor_onClickHandler() {
    this.setState({
      fullScreenEditor: !this.state.fullScreenEditor
    });
  }

  history_onChangeHandler() {
    this.updateCurGameHistory();

    this.setState({
      showHistory: !this.state.showHistory,
      selectedHistoryItem: this.history[0],
      compareHistoryItem: undefined
    });
  }

  restore_onClickHandler(history) {
    this.props.game.dirty = true;

    this.setState({
      code: history.gameLoopFnText,
      showHistory: false
    });
  }

  historyItem_onChangeHandler(history) {
    this.setState({
      selectedHistoryItem: history
    });
  }

  compareHistoryItem_onChangeHandler(item, ix) {
    this.setState({
      compareHistoryItem: item
    });
  }
}
