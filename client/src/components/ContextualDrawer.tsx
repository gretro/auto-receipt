import { Box, Divider, Drawer, makeStyles, Paper, PaperProps, Theme } from '@material-ui/core';
import React from 'react';

interface Props {
  open?: boolean;
  onDrawerClose: () => void;
  drawerLevel?: number;
  surfaceComponent?: React.ElementType<React.HTMLAttributes<HTMLElement>>;
  SurfaceProps?: PaperProps;
  header?: React.ReactElement;
  footer?: React.ReactElement;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  drawerSurface: (props) => ({
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    width: `${80 - (props.drawerLevel || 0) * 20}vw`,
    height: '100vh',
    overflow: 'hidden',
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
    },
  }),
  header: {
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: `0 ${theme.spacing(-2)}px`,
  },
  mainArea: {
    overflowY: 'auto',
    margin: theme.spacing(0, -2),
    padding: theme.spacing(0, 2),
  },
}));

export const ContextualDrawer: React.FC<Props> = (props) => {
  const styles = useStyles(props);

  return (
    <Drawer anchor="right" open={props.open} onClose={props.onDrawerClose}>
      <Paper className={styles.drawerSurface} component={props.surfaceComponent ?? 'aside'} {...props.SurfaceProps}>
        <header className={styles.header}>{props.header}</header>
        <Box className={styles.mainArea}>{props.children}</Box>
        <footer>
          {props.footer && <Divider className={styles.divider} />}
          {props.footer}
        </footer>
      </Paper>
    </Drawer>
  );
};
