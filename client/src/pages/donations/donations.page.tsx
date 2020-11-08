import { Box, Button, makeStyles, Snackbar } from '@material-ui/core';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import RefreshIcon from '@material-ui/icons/Refresh';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchDonations } from '../../api/donations.api';
import { PageHeader } from '../../components/page-header';
import { authContext } from '../../context/auth.context';
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
  const authUser = useContext(authContext)?.state;
  const styles = useStyles();
  const availableFiscalYears = useMemo(() => getAvailableFiscalYears(now, 3), []);

  const [selectingFiscalYear, setSelectingFiscalYear] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(availableFiscalYears[0]);
  const [isLoading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);

  const fetchDonationsFromApi = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchDonationsResponse = await fetchDonations(fiscalYear, authUser);
      setDonations(fetchDonationsResponse.donations);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching donations', err);
      setError('An error occurred while fetching the donations. Please try again by refreshing the page.');
    }
  }, [fiscalYear, authUser]);

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

  const handleDrawerClosed = (newDonation: Donation | null) => {
    setActiveDonation(null);

    if (newDonation) {
      setDonations((donations) =>
        donations.map((donation) => {
          if (donation.id === newDonation.id) {
            return newDonation;
          }

          return donation;
        }),
      );
    }
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
            disabled={isLoading && !error}
            onClick={fetchDonationsFromApi}
          >
            Refresh
          </Button>
        </PageHeader>
      </header>

      <div className={styles.pageContent}>
        <DonationsGrid isLoading={isLoading} donations={donations} onDonationSelected={handleDonationSelected} />
      </div>

      <DonationDetailsDrawer donation={activeDonation} onDrawerClose={handleDrawerClosed} />
      <Snackbar open={!!error} message={error || ''} />
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
