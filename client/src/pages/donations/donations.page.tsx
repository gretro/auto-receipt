import { Box, Button, makeStyles } from '@material-ui/core';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import RefreshIcon from '@material-ui/icons/Refresh';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '../../api/api.hook';
import { PageHeader } from '../../components/page-header';
import { Donation } from '../../models/donation';
import { DonationDetailsDrawer } from './components/donation-details-drawer/donation-details-drawer';
import { DonationsGrid } from './components/donations-grid/donations-grid';
import { FiscalYearSelector } from './components/fiscal-year-selector/fiscal-year-selector';

const useStyles = makeStyles((theme) => ({
  pageGrid: {
    height: '100%',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    gridTemplateColumns: '1fr',
    gridTemplateAreas: `
      'header'
      'content'
    `,
    gap: `${theme.spacing(2)}px`,
  },
  pageHeader: {
    gridArea: 'header',
  },
  pageContent: {
    gridArea: 'content',
    display: 'grid',
  },
}));

function getAvailableFiscalYears(now: Date, count: number): string[] {
  const currentYear = now.getUTCFullYear();

  return new Array(count).fill(null).map((_, index) => {
    return (currentYear - index).toString();
  });
}

const now = new Date();

export const DonationsPage: React.FC = () => {
  const styles = useStyles();
  const availableFiscalYears = useMemo(() => getAvailableFiscalYears(now, 3), []);
  const api = useApi();

  const [selectingFiscalYear, setSelectingFiscalYear] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(availableFiscalYears[0]);
  const [isLoading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);

  const fetchDonationsFromApi = useCallback(() => {
    api(async (api) => {
      setLoading(true);

      try {
        const fetchDonationsResponse = await api.fetchDonations(fiscalYear);
        setDonations(fetchDonationsResponse.donations);
      } finally {
        setLoading(false);
      }
    }, 'fetching donations');
  }, [api, fiscalYear]);

  useEffect(() => {
    fetchDonationsFromApi();
  }, [fetchDonationsFromApi]);

  const handleChangeFiscalYear = () => {
    setSelectingFiscalYear(true);
  };

  const handleChangeFiscalYearClose = () => {
    setSelectingFiscalYear(false);
  };

  const handleDonationSelected = (donationId: string) => {
    const nextActiveDonation = donations.find((donation) => donation.id === donationId);
    if (!nextActiveDonation) {
      console.error('Invalid donation ID.', donationId);
      setActiveDonation(null);
    } else {
      setActiveDonation(nextActiveDonation);
    }
  };

  const handleDonationUpdated = (newDonation: Donation) => {
    setDonations((donations) =>
      donations.map((donation) => {
        if (donation.id === newDonation.id) {
          return newDonation;
        }

        return donation;
      }),
    );

    setActiveDonation(newDonation);
  };

  const handleDrawerClosed = () => {
    setActiveDonation(null);
  };

  return (
    <Box className={styles.pageGrid}>
      <header className={styles.pageHeader}>
        <PageHeader pageTitle={`${fiscalYear} Donations`}>
          <Button
            color="primary"
            variant="contained"
            startIcon={<CalendarTodayIcon />}
            onClick={handleChangeFiscalYear}
          >
            Change fiscal year
          </Button>
          <Button
            color="primary"
            variant="contained"
            startIcon={<RefreshIcon />}
            disabled={isLoading}
            onClick={fetchDonationsFromApi}
          >
            Refresh
          </Button>
        </PageHeader>
      </header>

      <div className={styles.pageContent}>
        <DonationsGrid isLoading={isLoading} donations={donations} onDonationSelected={handleDonationSelected} />
      </div>

      <DonationDetailsDrawer
        donation={activeDonation}
        onDrawerClose={handleDrawerClosed}
        onDonationUpdated={handleDonationUpdated}
      />
      <FiscalYearSelector
        open={selectingFiscalYear}
        initialFiscalYear={fiscalYear}
        availableYears={availableFiscalYears}
        onFiscalYearSelected={setFiscalYear}
        onClose={handleChangeFiscalYearClose}
      />
    </Box>
  );
};
