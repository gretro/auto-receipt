import React, { useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useApi } from '../../api/api.hook';
import { CreateDonationDTO } from '../../api/donation-create.dto';
import { appUrls } from '../../app-urls';
import { DonationCreateDrawer } from './components/donation-create-drawer/donation-create-drawer';

export const DonationsCreateDrawerPage: React.FC = () => {
  const api = useApi();
  const history = useHistory();
  const [operationId, setOperationId] = useState(1);
  const [busy, setBusy] = useState(false);
  const { fiscalYear } = useParams<{ fiscalYear: string }>();

  const shouldRefreshRef = useRef(false);

  const handleDrawerClosed = () => {
    history.push(appUrls.donations().forFiscalYear(fiscalYear), { reload: shouldRefreshRef.current });
  };

  const handleDonationCreated = (donationCreate: CreateDonationDTO, createMore: boolean): void => {
    api(
      async (api) => {
        setBusy(true);

        try {
          await api.createDonation(donationCreate);
          shouldRefreshRef.current = true;

          if (createMore) {
            setOperationId((current) => current + 1);
          } else {
            history.push(appUrls.donations().forFiscalYear(fiscalYear), { reload: true });
          }
        } finally {
          setBusy(false);
        }
      },
      'creating donation',
      {
        showLoading: false,
        showSuccess: true,
      },
    );
  };

  return (
    <DonationCreateDrawer
      fiscalYear={fiscalYear}
      busy={busy}
      operationId={operationId}
      onCancel={handleDrawerClosed}
      onSave={handleDonationCreated}
    />
  );
};
