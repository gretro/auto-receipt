import { Snackbar } from '@material-ui/core';
import React, { createContext, Dispatch, Reducer, useReducer } from 'react';
import { Alert } from '../components/alert';

export interface SystemNotification {
  active: boolean;
  message?: string;
  type?: 'info' | 'success' | 'error' | 'loading';
  timeoutInMs?: number | null;
}

export const notificationContext = createContext<{
  state: SystemNotification;
  dispatch: Dispatch<NotificationAction>;
}>(null as any);

export interface ShowSystemNotificationAction {
  type: 'show-notification';
  payload: Required<Omit<SystemNotification, 'active'>>;
}

export interface ClearSystemNotificationAction {
  type: 'clear-notification';
}

type NotificationAction = ShowSystemNotificationAction | ClearSystemNotificationAction;

export const NotificationProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer<Reducer<SystemNotification, NotificationAction>>(
    (_, action) => {
      switch (action.type) {
        case 'show-notification':
          return {
            ...action.payload,
            active: true,
          };

        case 'clear-notification':
          return {
            active: false,
          };

        default:
          throw new Error('Unknown action');
      }
    },
    { active: false },
  );

  const handleNotificationClosed = () => {
    dispatch({ type: 'clear-notification' });
  };

  return (
    <notificationContext.Provider value={{ state, dispatch }}>
      {children}
      <Snackbar
        open={state.active}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={state.timeoutInMs || null}
        onClose={handleNotificationClosed}
      >
        <Alert type={state.type || 'info'} message={state.message || ''} />
      </Snackbar>
    </notificationContext.Provider>
  );
};
