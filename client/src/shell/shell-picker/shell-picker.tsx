import { Box, CircularProgress, makeStyles, Typography } from '@material-ui/core';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import React, { useContext, useEffect, useState } from 'react';
import { authContext } from '../../context/auth.context';
import { AppShell } from '../app-shell/app-shell';
import { AuthenticationShell } from '../auth-shell/auth-shell';

const useStyles = makeStyles({
  loadingBox: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
});

export const ShellPicker: React.FC = () => {
  const [isAuthInit, setAuthInit] = useState(false);
  const auth = useContext(authContext);
  const authDispatch = auth?.dispatch;
  const styles = useStyles();

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (user) => {
      setAuthInit(true);

      if (user) {
        authDispatch?.({
          type: 'authenticated',
          payload: {
            fullName: user.displayName || user.email || '',
            email: user.email || '',
            firebaseUser: user,
          },
        });
      } else {
        authDispatch?.({
          type: 'logged-out',
        });
      }
    });
  }, [authDispatch]);

  const authNotInit = (
    <Box className={styles.loadingBox}>
      <CircularProgress />
      <Box marginTop={2}>
        <Typography variant="subtitle1">Loading. Please wait</Typography>
      </Box>
    </Box>
  );
  const authInit = auth?.state ? <AppShell /> : <AuthenticationShell />;

  return isAuthInit ? authInit : authNotInit;
};
