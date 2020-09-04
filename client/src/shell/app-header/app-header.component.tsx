import { AppBar, Toolbar, Typography } from '@material-ui/core';
import React from 'react';
import { AppLink } from '../app-link/app-link.component';

export const AppHeader: React.FC = () => {
  return (
    <AppBar>
      <Toolbar>
        <AppLink to="/">
          <Typography variant="h6">Auto Receipt Dashboard</Typography>
        </AppLink>
      </Toolbar>
    </AppBar>
  );
};
