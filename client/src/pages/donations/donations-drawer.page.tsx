import React, { useContext, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { appUrls } from '../../app-urls';
import { notificationContext } from '../../context/notification.context';
import { Donation } from '../../models/donation';
import { DonationDetailsDrawer } from './components/donation-details-drawer/donation-details-drawer';

interface Props {
  donations: Donation[];
  onDonationUpdated: (newDonation: Donation) => void;
}

export const DonationsDrawerPage: React.FC<Props> = (props) => {
  const history = useHistory();
  const notification = useContext(notificationContext);

  const { donationId, fiscalYear } = useParams<{ donationId: string; fiscalYear: string }>();
  const activeDonation = useMemo(() => {
    const activeDonation = props.donations.find((donation) => donation.id === donationId);
    return activeDonation || null;
  }, [donationId, props.donations]);

  if (!activeDonation) {
    notification.dispatch({
      type: 'show-notification',
      payload: {
        message: 'Could not find donation',
        type: 'error',
        timeoutInMs: 7500,
      },
    });
    history.replace(appUrls.donations().forFiscalYear(fiscalYear));
  }

  const handleDrawerClosed = () => {
    if (history.length === 0) {
      history.push(appUrls.donations().forFiscalYear(fiscalYear));
    } else {
      history.goBack();
    }
  };

  return (
    <DonationDetailsDrawer
      donation={activeDonation}
      onDrawerClose={handleDrawerClosed}
      onDonationUpdated={props.onDonationUpdated}
    />
  );
};
