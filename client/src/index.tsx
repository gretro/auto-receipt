import 'firebase/analytics';
import firebase from 'firebase/app';
import 'firebase/auth';
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { AppConfig, setAppConfig } from './app-config';

fetch('/config.json')
  .then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      throw new Error('Received a non-200 HTTP response');
    }
  })
  .then((appConfig: AppConfig) => {
    setAppConfig(appConfig);

    firebase.initializeApp(appConfig.firebase);
    firebase.analytics();

    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById('root'),
    );
  })
  .catch((err) => {
    console.error('Unable to fetch the configuration', err);

    document.querySelector('#bootstrap-loading')?.classList.add('hidden');
    document.querySelector('#bootstrap-error')?.classList.remove('hidden');
  });
