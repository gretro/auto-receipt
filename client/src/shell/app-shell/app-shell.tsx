import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Theme,
  Toolbar,
  Typography,
} from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ListIcon from '@material-ui/icons/List';
import PersonIcon from '@material-ui/icons/Person';
import clsx from 'clsx';
import firebase from 'firebase/app';
import React, { useContext, useState } from 'react';
import { authContext } from '../../context/auth.context';

const COLLAPSED_DRAWER_WIDTH = '56px';
const EXPANDED_DRAWER_WIDTH = '300px';

interface StyleProps {
  open: boolean;
}

const useStyles = makeStyles<Theme, StyleProps>((theme: Theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    height: '100vh',
  },
  collapsedDrawer: {
    width: COLLAPSED_DRAWER_WIDTH,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  expandedDrawer: {
    width: EXPANDED_DRAWER_WIDTH,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaper: (props) => ({
    width: props.open ? EXPANDED_DRAWER_WIDTH : COLLAPSED_DRAWER_WIDTH,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }),
  expand: {
    transform: 'rotate(-90deg)',
  },
  collapse: {
    transform: 'rotate(90deg)',
  },
  navSection: {
    flex: 1,
    overflow: 'auto',
  },
  hideOnExpand: (props) => ({
    display: props.open ? 'none' : 'block',
  }),
  hideOnCollapse: (props) => ({
    display: props.open ? 'block' : 'none',
  }),
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
    <>
      <AppBar position="fixed" className={styles.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            Auto Receipt
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        className={clsx(styles.drawer, { [styles.collapsedDrawer]: !open, [styles.expandedDrawer]: open })}
      >
        <Toolbar />
        <Box className={styles.drawerPaper}>
          <Box padding={2} position="relative" className={styles.hideOnCollapse}>
            <Box position="absolute" right={16}>
              <IconButton size="small" title="Collapse drawer" onClick={handleToggleDrawer}>
                <ExpandMoreIcon className={styles.collapse} />
              </IconButton>
            </Box>
            <Box marginBottom={2}>
              <Avatar alt={auth?.state?.fullName}>
                <PersonIcon />
              </Avatar>
            </Box>
            <Typography variant="h6" noWrap title={auth?.state?.fullName}>
              {auth?.state?.fullName}
            </Typography>
            <Typography variant="caption" title={auth?.state?.email}>
              {auth?.state?.email}
            </Typography>
          </Box>
          <Divider className={styles.hideOnCollapse} />
          <List component="nav" className={styles.navSection}>
            {open ? null : (
              <Box>
                <Button title="Expand drawer" onClick={handleToggleDrawer}>
                  <ExpandMoreIcon className={styles.expand} />
                </Button>
              </Box>
            )}
            <ListItem button>
              <ListItemIcon title="Donations">
                <ListIcon />
              </ListItemIcon>
              <ListItemText className={styles.hideOnCollapse} primary="Donations" />
            </ListItem>
          </List>
          <Divider className={styles.hideOnCollapse} />
          <List className={styles.hideOnCollapse}>
            <ListItem button onClick={handleLogOut}>
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Log out" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};
