import { Drawer, GridList, GridListTile, makeStyles, Paper, Theme } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';
import { PageHeader } from '../../../../components/page-header';
import { Donation } from '../../../../models/donation';
import { DonorInformation } from './components/donor-information/donor-information';
import { PaymentInformation } from './components/payment-information/payment-information';

interface Props {
  donation: Donation | null;
  onDrawerClose: (replacedDonation: Donation | null) => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  drawerSurface: {
    width: '80vw',
    height: '100vh',
    padding: theme.spacing(2),
  },
  header: {
    marginBottom: theme.spacing(2),
  },
}));

export const DonationDetailsDrawer: React.FC<Props> = (props) => {
  const styles = useStyles(props);

  const handleDrawerClose = () => {
    props.onDrawerClose(props.donation);
  };

  return (
    <Drawer anchor="right" open={!!props.donation} onClose={handleDrawerClose}>
      <Paper className={styles.drawerSurface} component="aside">
        <header className={styles.header}>
          <PageHeader
            pageTitle="Donation details"
            subTitle={`Donation ID: ${props.donation?.id}`}
            actionButtonIcon={<CloseIcon />}
            actionButtonLabel="Close Drawer"
            onActionButtonClicked={handleDrawerClose}
            smallTitle
          />
        </header>
        <GridList cols={3} spacing={8} cellHeight="auto">
          <GridListTile>
            <DonorInformation donor={props.donation?.donor} />
          </GridListTile>
          <GridListTile>
            <PaymentInformation
              donationType={props.donation?.type || 'one-time'}
              payments={props.donation?.payments || []}
            />
          </GridListTile>
        </GridList>
      </Paper>
    </Drawer>
  );
};
