import { Box, Divider, IconButton, makeStyles, Theme, Typography } from '@material-ui/core';
import React from 'react';

interface Props {
  actionButtonIcon?: React.ReactElement;
  actionButtonLabel?: string;
  onActionButtonClicked?: () => void;
  pageTitle: string;
  subTitle?: string;
  smallTitle?: boolean;
}

const useStyle = makeStyles<Theme, Props>((theme) => ({
  actionButton: {
    marginRight: theme.spacing(-1),
  },
  pageTitle: {
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: theme.spacing(1.5),
    alignItems: 'center',
    '&> *:not(:first-child)': {
      marginLeft: theme.spacing(2),
    },
  },
  divider: {
    marginLeft: theme.spacing(-2),
    marginRight: theme.spacing(-2),
  },
}));

export const PageHeader: React.FC<Props> = (props) => {
  const styles = useStyle(props);

  const handleActionButtonClicked = () => {
    props.onActionButtonClicked?.();
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
        <Box>
          <Typography variant={props.smallTitle ? 'h6' : 'h5'} component="h1">
            {props.pageTitle}
          </Typography>
          {props.subTitle ? <Typography variant="caption">{props.subTitle}</Typography> : null}
        </Box>
        {props.children}
      </Box>
      <Divider className={styles.divider} />
    </>
  );
};
