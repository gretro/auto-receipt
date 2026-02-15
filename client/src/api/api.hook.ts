import { capitalize } from '@material-ui/core/utils';
import { useContext, useRef } from 'react';
import { notificationContext } from '../context/notification.context';
import { httpApi } from './donations.api';

interface ApiOptions {
  showLoading?: boolean;
  showSuccess?: boolean;
}

type ApiHook = (fn: (api: typeof httpApi) => Promise<void>, actionText: string, options?: ApiOptions) => void;

export function useApi(): ApiHook {
  const notifications = useContext(notificationContext);
  const apiHookRef = useRef<ApiHook>(async function apiHook(
    fn: (api: typeof httpApi) => Promise<void>,
    actionText: string,
    options = { showLoading: false, showSuccess: false },
  ) {
    try {
      if (options.showLoading) {
        notifications.dispatch({
          type: 'show-notification',
          payload: {
            message: `${capitalize(actionText)}...`,
            type: 'loading',
            timeoutInMs: null,
          },
        });
      }

      await fn(httpApi);

      if (options.showSuccess) {
        notifications.dispatch({
          type: 'show-notification',
          payload: {
            message: `Success ${actionText}`,
            type: 'success',
            timeoutInMs: 3000,
          },
        });
      } else if (options.showLoading) {
        notifications.dispatch({ type: 'clear-notification' });
      }
    } catch (error) {
      console.error('Error making API request', error);
      notifications.dispatch({
        type: 'show-notification',
        payload: {
          message: 'An error occured. Please try again.',
          type: 'error',
          timeoutInMs: 7500,
        },
      });
    }
  });

  return apiHookRef.current;
}
