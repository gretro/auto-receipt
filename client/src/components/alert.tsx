import { Box, makeStyles, Theme } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorIcon from '@material-ui/icons/Error';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import React from 'react';

interface Props {
  message: string;
  type: 'loading' | 'info' | 'warning' | 'success' | 'error';
}

const colorMap = {
  loading: '#2196f3',
  info: '#2196f3',
  warning: '#ff9800',
  success: '#4caf50',
  error: '#f44336',
};

const useStyles = makeStyles<Theme, Props>((theme) => ({
  alertBox: (props) => ({
    backgroundColor: colorMap[props.type],
    color: theme.palette.common.white,
    borderRadius: theme.spacing(0.5),
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),
}));

const iconMap = {
  // eslint-disable-next-line react/display-name
  loading: () => <HourglassEmptyIcon />,
  // eslint-disable-next-line react/display-name
  info: () => <InfoIcon />,
  // eslint-disable-next-line react/display-name
  warning: () => <WarningIcon />,
  // eslint-disable-next-line react/display-name
  success: () => <CheckCircleOutlineIcon />,
  // eslint-disable-next-line react/display-name
  error: () => <ErrorIcon />,
};

export const Alert: React.FC<Props> = (props) => {
  const icon = iconMap[props.type]();
  const styles = useStyles(props);

  return (
    <Box className={styles.alertBox}>
      {icon}
      {props.message}
    </Box>
  );
};
