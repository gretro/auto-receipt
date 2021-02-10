import { Box, Divider, IconButton, makeStyles, Menu, MenuItemProps, Theme, Typography } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import React, { useRef, useState } from 'react';

interface Props {
  actionButtonIcon?: React.ReactElement;
  actionButtonLabel?: string;
  onActionButtonClicked?: () => void;
  pageTitle: string;
  subTitle?: string;
  smallTitle?: boolean;
  hamburgerMenuItems?: React.ReactElement<MenuItemProps>[];
}

const useStyle = makeStyles<Theme, Props>((theme) => ({
  pageTitle: {
    display: 'grid',
    gridTemplateColumns: 'auto auto 1fr auto',
    gridTemplateAreas: `
      "actionButton text actions moreButton"
    `,
    gap: `${theme.spacing(2)}px`,
    paddingBottom: theme.spacing(1.5),
  },
  actionButton: {
    gridArea: 'actionButton',
    marginRight: theme.spacing(-1),
  },
  text: {
    gridArea: 'text',
  },
  flexContent: {
    gridArea: 'actions',
    display: 'grid',
    gridAutoColumns: 'auto',
    gridAutoFlow: 'column',
    alignItems: 'center',
    justifyContent: 'start',
    gap: `${theme.spacing(2)}px`,
  },
  more: {
    gridArea: 'moreButton',
    display: 'grid',
    alignItems: 'center',
  },
  divider: {
    marginLeft: theme.spacing(-2),
    marginRight: theme.spacing(-2),
  },
}));

export const PageHeader: React.FC<Props> = (props) => {
  const styles = useStyle(props);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuAnchorEl = useRef<HTMLButtonElement | null>(null);

  const handleActionButtonClicked = () => {
    props.onActionButtonClicked?.();
  };

  const handleMenuOpened = () => {
    setMenuOpen(true);
  };

  const handleMenuClosed = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <Box className={styles.pageTitle}>
        {props.actionButtonIcon ? (
          <IconButton
            className={styles.actionButton}
            title={props.actionButtonLabel}
            onClick={handleActionButtonClicked}
          >
            {props.actionButtonIcon}
          </IconButton>
        ) : null}
        <Box className={styles.text}>
          <Typography variant={props.smallTitle ? 'h6' : 'h5'} component="h1">
            {props.pageTitle}
          </Typography>
          {props.subTitle ? <Typography variant="caption">{props.subTitle}</Typography> : null}
        </Box>
        <Box className={styles.flexContent}>{props.children}</Box>
        {props.hamburgerMenuItems ? (
          <Box className={styles.more}>
            <IconButton ref={menuAnchorEl} title="More options" size="small" onClick={handleMenuOpened}>
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={menuAnchorEl.current} open={menuOpen} onClose={handleMenuClosed} onClick={handleMenuClosed}>
              {props.hamburgerMenuItems}
            </Menu>
          </Box>
        ) : null}
      </Box>
      <Divider className={styles.divider} />
    </>
  );
};
