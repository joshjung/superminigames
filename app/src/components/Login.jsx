import React from 'react';

import {Model} from 'ringa';

import {RingaComponent, I18NModel, TextInput, Button, ScreenModel} from 'ringa-fw-react';
import {dependency} from 'react-ringa';

import history from '../global/history';

import APIController from '../controllers/APIController';

const LoginModel = Model.construct('LoginModel', [{
  name: 'email'
}, {
  name: 'password'
}]);

export default class Login extends RingaComponent {
  //-----------------------------------
  // Constructor
  //-----------------------------------
  constructor(props) {
    super(props);

    this.state = {
      error: false
    };

    this.depend(
      dependency(I18NModel, 'language'),
      dependency(ScreenModel, 'curBreakpointIx')
    );

    this.login = new LoginModel();
  }

  //-----------------------------------
  // Lifecycle
  //-----------------------------------
  render() {
    const {error} = this.state;

    return <div className="editor">
      Email:
      <TextInput model={this.login} modelField="email" onEnterKey={this.email_onEnterKeyHandler}/>
      Password:
      <TextInput model={this.login} modelField="password" type="password" onEnterKey={this.password_onEnterKeyHandler}/>
      {error && <div>Invalid login!</div>}
      <Button label="Login" onClick={this.login_onClickHandler} />
      <Button label="Register" onClick={this.register_onClickHandler} />
    </div>;
  }

  //-----------------------------------
  // Events
  //-----------------------------------
  email_onEnterKeyHandler() {
    this.login_onClickHandler();
  }

  password_onEnterKeyHandler() {
    this.login_onClickHandler();
  }

  login_onClickHandler() {
    const {curBreakpointIx} = this.state;

    this.dispatch(APIController.LOGIN, {
      body: {
        email: this.login.email,
        password: this.login.password,
        access_token: 'QiW54Gu0IqrYE6v8zHOSzqVdbIeiHknn'
      }
    }).then(success => {
      if (success) {
        if (curBreakpointIx > 3) {
          history.replace('/games/mine');
        } else {
          history.replace('/');
        }
      } else {
        this.setState({
          error: true
        });
      }
    });
  }

  register_onClickHandler() {
    history.replace('/users/create');
  }
}
