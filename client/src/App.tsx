import { CssBaseline } from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import React from 'react';
import { AuthProvider } from './context/auth.context';
import { NotificationProvider } from './context/notification.context';
import { ShellPicker } from './shell/shell-picker/shell-picker';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});

export const App: React.FC = () => {
  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <AuthProvider>
            <ShellPicker />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </>
  );
};
