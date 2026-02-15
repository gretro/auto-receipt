import 'firebase/analytics';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import 'firebase/auth';
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

    initializeApp(appConfig.firebase);
    getAnalytics();

    ReactDOM.render(
      <App />,
      // <React.StrictMode>
      // </React.StrictMode>,
      document.getElementById('root'),
    );
  })
  .catch((err) => {
    console.error('Unable to fetch the configuration', err);

    document.querySelector('#bootstrap-loading')?.classList.add('hidden');
    document.querySelector('#bootstrap-error')?.classList.remove('hidden');
  });
