import { Button, Drawer, Typography } from '@material-ui/core';
import React from 'react';
import { Donation } from '../../../../models/donation';

interface Props {
  donation: Donation | null;
  onDrawerClose: (replacedDonation: Donation | null) => void;
}

export const DonationDetailsDrawer: React.FC<Props> = (props) => {
  const handleDrawerClose = () => {
    props.onDrawerClose(props.donation);
  };

  return (
    <Drawer anchor="right" open={!!props.donation}>
      <Button onClick={handleDrawerClose}>Close</Button>
      <Typography>{JSON.stringify(props.donation)}</Typography>
    </Drawer>
  );
};
