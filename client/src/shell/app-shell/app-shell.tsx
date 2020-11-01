import { AppBar, Box, makeStyles, Theme, Toolbar, Typography } from '@material-ui/core';
import firebase from 'firebase/app';
import React, { useContext, useState } from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import { authContext } from '../../context/auth.context';
import { NavDrawer } from '../components/nav-drawer/nav-drawer';
import { AppRouting } from '../routing/app-routing';

const COLLAPSED_DRAWER_WIDTH = '56px';
const EXPANDED_DRAWER_WIDTH = '300px';

interface StyleProps {
  open: boolean;
}

const useStyles = makeStyles<Theme, StyleProps>((theme: Theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  appLink: {
    color: '#FFF',
    textDecoration: 'none',
  },
  appGrid: (props) => ({
    height: '100vh',
    display: 'grid',
    gridTemplateColumns: `${props.open ? EXPANDED_DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH} auto`,
    gridTemplateRows: 'auto',
    gridTemplateAreas: `'navDrawer contentArea'`,
  }),
  drawer: {
    gridArea: 'navDrawer',
  },
  contentArea: {
    gridArea: 'contentArea',
    padding: theme.spacing(2),
    display: 'grid',
    gridAutoFlow: 'row',
    gridTemplateRows: 'auto 1fr',
    gridTemplateColumns: 'auto',
  },
}));

export const AppShell: React.FC = () => {
  const auth = useContext(authContext);
  const [open, setOpen] = useState(true);
  const styles = useStyles({ open });

  const handleToggleDrawer = () => {
    setOpen((current) => !current);
  };

  const handleLogOut = async () => {
    try {
      await firebase.auth().signOut();
    } catch (err) {
      console.error('Unable to log out', err);
      window.location.href = 'https://google.ca';
    }
  };

  return (
    <BrowserRouter>
      <AppBar position="fixed" className={styles.appBar}>
        <Toolbar>
          <Typography variant="h6" component="span" noWrap>
            <Link to="/" className={styles.appLink}>
              Auto Receipt Admin Dashboard
            </Link>
          </Typography>
        </Toolbar>
      </AppBar>
      <Box className={styles.appGrid}>
        <Box component="aside">
          <NavDrawer
            open={open}
            expandedWidth={EXPANDED_DRAWER_WIDTH}
            collapsedWidth={COLLAPSED_DRAWER_WIDTH}
            userFullName={auth?.state?.fullName}
            userEmail={auth?.state?.email}
            onDrawerToggle={handleToggleDrawer}
            onLogOut={handleLogOut}
          />
        </Box>
        <Box className={styles.contentArea} component="main">
          <Toolbar />

          <AppRouting />
        </Box>
      </Box>
    </BrowserRouter>
  );
};
