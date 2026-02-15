import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@material-ui/core';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useContext, useState } from 'react';
import { notificationContext } from '../../context/notification.context';

interface LoginFormData {
  username: string;
  password: string;
  loading: boolean;
}

export const AuthenticationShell: React.FC = () => {
  const notifications = useContext(notificationContext);

  const [state, setState] = useState<LoginFormData>({
    username: '',
    password: '',
    loading: false,
  });

  const handleUsernameChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, username: event.target.value });
  };

  const handlePasswordChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, password: event.target.value });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (state.loading) {
      return;
    }

    setState({ ...state, loading: true });
    notifications.dispatch({ type: 'clear-notification' });

    try {
      const userCredentials = await signInWithEmailAndPassword(getAuth(), state.username, state.password);
      console.log('User credentials received', userCredentials);
    } catch (err) {
      console.error('Error authenticating', err);

      setState({
        ...state,
        loading: false,
      });

      notifications.dispatch({
        type: 'show-notification',
        payload: {
          message: 'There was an error authenticating you. Please check your credentials and retry.',
          type: 'error',
          timeoutInMs: 3000,
        },
      });
    }
  };

  return (
    <Box>
      <Dialog open disableBackdropClick disableEscapeKeyDown fullWidth aria-labelledby="auth-dialog-title">
        <form onSubmit={handleFormSubmit}>
          <DialogTitle id="auth-dialog-title">Please log in to use AutoReceipt</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              label="Email address"
              type="email"
              fullWidth
              margin="dense"
              disabled={state.loading}
              value={state.username}
              onChange={handleUsernameChanged}
              required
            ></TextField>
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="dense"
              disabled={state.loading}
              value={state.password}
              onChange={handlePasswordChanged}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button type="submit" color="primary" disabled={state.loading}>
              {state.loading ? 'Logging in...' : 'Log in'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
