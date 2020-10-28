import { Typography } from '@material-ui/core';
import React, { useContext } from 'react';
import { authContext } from '../../context/auth.context';

export const AppShell: React.FC = () => {
  const auth = useContext(authContext);

  return <Typography variant="h1">Welcome, {auth?.state?.fullName}!</Typography>;
};
