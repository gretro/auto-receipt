import { Drawer, makeStyles, Typography } from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles(() => ({
  drawer: {
    width: '100%',
  },
}));

export const AppSidebar: React.FC = () => {
  const styles = useStyles();

  return (
    <Drawer variant="permanent" container={window.document.body} className={styles.drawer}>
      <Typography variant="h6">Gabriel Lemire</Typography>
    </Drawer>
  );
};
