import { useMediaQuery, useTheme } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';
import { ContextualDrawer } from '../../../../components/ContextualDrawer';
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

export const DonationDetailsDrawer: React.FC<Props> = (props) => {
  const theme = useTheme();

  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isPhone = useMediaQuery(theme.breakpoints.only('xs'));

  const cols = isPhone ? 1 : isTablet ? 2 : 3;

  const handleDrawerClose = () => {
    props.onDrawerClose();
  };

  const handleDonationUpdated = (newDonation: Donation) => {
    props.onDonationUpdated(newDonation);
  };

  const headerEl = (
    <PageHeader
      pageTitle="Donation details"
      subTitle={`Donation ID: ${props.donation?.id}`}
      actionButtonIcon={<CloseIcon />}
      actionButtonLabel="Close Drawer"
      onActionButtonClicked={handleDrawerClose}
      smallTitle
    />
  );

  return (
    <ContextualDrawer header={headerEl} open={!!props.donation} onDrawerClose={handleDrawerClose}>
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
            canSendByEmail={!!props.donation?.donor?.email && !!props.donation.emailReceipt}
          />
        </FlowGridItem>
      </FlowGrid>
    </ContextualDrawer>
  );
};
