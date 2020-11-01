import { Box, makeStyles, MenuItem, Select, Snackbar, Typography } from '@material-ui/core';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { fetchDonations } from '../../api/donations.api';
import { authContext } from '../../context/auth.context';
import { Donation } from '../../models/donation';
import { DonationsGrid } from './components/donations-grid/donations-grid';

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
  pageTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    '&> *:not(:first-child)': {
      marginLeft: theme.spacing(2),
    },
  },
  pageContent: {
    gridArea: 'content',
    display: 'grid',
  },
}));

function getAvailableFiscalYears(now: Date, count: number) {
  const currentYear = now.getUTCFullYear();

  return new Array(count).fill(null).map((_, index) => {
    return currentYear - index;
  });
}

const now = new Date();

export const DonationsPage: React.FC = () => {
  const authUser = useContext(authContext)?.state;
  const styles = useStyles();
  const availableFiscalYears = useMemo(() => getAvailableFiscalYears(now, 3), []);

  const [fiscalYear, setFiscalYear] = useState(availableFiscalYears[0]);
  const [isLoading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDonationsFromApi() {
      setLoading(true);
      setError(null);

      try {
        const fetchDonationsResponse = await fetchDonations(fiscalYear, authUser);
        setDonations(fetchDonationsResponse.donations);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching donations for fiscal year ' + fiscalYear);
        setError('An error occurred while fetching the donations.');
      }
    }

    fetchDonationsFromApi();
  }, [fiscalYear, authUser]);

  const handleFiscalYearChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    if (typeof event.target.value !== 'number') {
      console.error('Next fiscal year could not be parsed');
      return;
    }

    setFiscalYear(event.target.value);
  };

  return (
    <Box className={styles.pageGrid}>
      <header className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h3" component="h1">
            Donations
          </Typography>
          <Select label="Fiscal year" value={fiscalYear} onChange={handleFiscalYearChange}>
            {availableFiscalYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Typography>Review, create and edit donations for the {fiscalYear} fiscal year.</Typography>
      </header>

      <div className={styles.pageContent}>
        <DonationsGrid isLoading={isLoading} donations={donations} />
      </div>

      <Snackbar open={!!error} message={error || ''} />
    </Box>
  );
};
