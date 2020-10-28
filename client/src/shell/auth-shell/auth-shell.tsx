import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, TextField } from '@material-ui/core';
import firebase from 'firebase/app';
import React, { useState } from 'react';

interface LoginFormData {
  username: string;
  password: string;
  loading: boolean;
  errorMessage: string | null;
}

export const AuthenticationShell: React.FC = () => {
  const [state, setState] = useState<LoginFormData>({
    username: '',
    password: '',
    loading: false,
    errorMessage: null,
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

    setState({ ...state, loading: true, errorMessage: null });

    try {
      const userCredentials = await firebase.auth().signInWithEmailAndPassword(state.username, state.password);
      console.log('User credentials received', userCredentials);
    } catch (err) {
      console.error('Error authenticating', err);

      setState({
        ...state,
        loading: false,
        errorMessage: 'There was an error authenticating you. Please check your credentials and retry.',
      });
    }
  };

  const clearError = () => {
    setState({ ...state, errorMessage: null });
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

            <Snackbar open={!!state.errorMessage} message={state.errorMessage} onClose={clearError} />
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
