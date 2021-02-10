import { Box, Drawer, makeStyles, Paper, Theme, useMediaQuery, useTheme } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';
import { FlowGrid, FlowGridItem } from '../../../../components/FlowGrid';
import { PageHeader } from '../../../../components/page-header';
import { Donation } from '../../../../models/donation';
import { DonorInformation } from './components/donor-information/donor-information';
import { PaymentInformation } from './components/payment-information/payment-information';
import { ReceiptsInformation } from './components/receipts-information/receipts-information';

interface Props {
  donation: Donation | null;
  onDonationUpdated: (replacedDonation: Donation) => void;
  onDrawerClose: () => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  drawerSurface: {
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    width: '80vw',
    height: '100vh',
    overflow: 'hidden',
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
    },
  },
  header: {
    marginBottom: theme.spacing(2),
  },
  mainArea: {
    overflowY: 'auto',
    margin: theme.spacing(-2),
    padding: theme.spacing(2),
  },
}));

export const DonationDetailsDrawer: React.FC<Props> = (props) => {
  const styles = useStyles(props);
  const theme = useTheme();

  const isTablet = useMediaQuery(theme.breakpoints.only('sm'));
  const isPhone = useMediaQuery(theme.breakpoints.only('xs'));

  const cols = isPhone ? 1 : isTablet ? 2 : 3;

  const handleDrawerClose = () => {
    props.onDrawerClose();
  };

  const handleDonationUpdated = (newDonation: Donation) => {
    props.onDonationUpdated(newDonation);
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
        <Box className={styles.mainArea}>
          <FlowGrid columns={cols} spacing={8}>
            <FlowGridItem>
              <DonorInformation donation={props.donation} onDonationUpdated={handleDonationUpdated} />
            </FlowGridItem>
            <FlowGridItem>
              <PaymentInformation
                donationType={props.donation?.type || 'one-time'}
                payments={props.donation?.payments || []}
              />
            </FlowGridItem>
            <FlowGridItem>
              <ReceiptsInformation
                donationId={props.donation?.id}
                documents={props.donation?.documents || []}
                canSendByEmail={!!props.donation?.donor?.email}
              />
            </FlowGridItem>
          </FlowGrid>
        </Box>
      </Paper>
    </Drawer>
  );
};
