import {
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
import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  open: boolean;
  onDrawerToggle: (nextOpen: boolean) => void;
  onLogOut: () => void;
  expandedWidth: string;
  collapsedWidth: string;
  userFullName?: string;
  userEmail?: string;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  drawerPaper: (props) => ({
    width: props.open ? props.expandedWidth : props.collapsedWidth,
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
  navLink: {
    textDecoration: 'none',
    color: theme.palette.text.primary,
  },
  hideOnExpand: (props) => ({
    display: props.open ? 'none' : 'block',
  }),
  hideOnCollapse: (props) => ({
    display: props.open ? 'block' : 'none',
  }),
}));

export const NavDrawer: React.FC<Props> = (props) => {
  const styles = useStyles(props);

  const handleToggleDrawer = () => {
    props.onDrawerToggle(!props.open);
  };

  return (
    <Drawer variant="permanent">
      <Toolbar />
      <Box className={styles.drawerPaper}>
        <Box padding={2} position="relative" className={styles.hideOnCollapse}>
          <Box position="absolute" right={16}>
            <IconButton size="small" title="Collapse drawer" onClick={handleToggleDrawer}>
              <ExpandMoreIcon className={styles.collapse} />
            </IconButton>
          </Box>
          <Box marginBottom={2}>
            <Avatar alt={props.userFullName}>
              <PersonIcon />
            </Avatar>
          </Box>
          <Typography variant="h6" noWrap title={props.userFullName}>
            {props.userFullName}
          </Typography>
          <Typography variant="caption" title={props.userEmail}>
            {props.userEmail}
          </Typography>
        </Box>
        <Divider className={styles.hideOnCollapse} />
        <List component="nav" className={styles.navSection}>
          {props.open ? null : (
            <Box>
              <Button title="Expand drawer" onClick={handleToggleDrawer}>
                <ExpandMoreIcon className={styles.expand} />
              </Button>
            </Box>
          )}
          <Link to="/donations" className={styles.navLink}>
            <ListItem button>
              <ListItemIcon title="Donations">
                <ListIcon />
              </ListItemIcon>
              <ListItemText className={styles.hideOnCollapse} primary="Donations" />
            </ListItem>
          </Link>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={props.onLogOut}>
            <ListItemIcon title="Log out">
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText className={styles.hideOnCollapse} primary="Log out" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};
