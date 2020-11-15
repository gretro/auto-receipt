import { Box, Button, makeStyles } from '@material-ui/core';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import RefreshIcon from '@material-ui/icons/Refresh';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Switch, useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { useApi } from '../../api/api.hook';
import { appUrls } from '../../app-urls';
import { PageHeader } from '../../components/page-header';
import { Donation } from '../../models/donation';
import { DonationsGrid } from './components/donations-grid/donations-grid';
import { FiscalYearSelector } from './components/fiscal-year-selector/fiscal-year-selector';
import { DonationsDrawerPage } from './donations-drawer.page';

const FISCAL_YEAR_REGEX = /^\d{4}$/;

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

  const history = useHistory();
  const { fiscalYear } = useParams<{ fiscalYear: string }>();
  const isFiscalYearValid = useMemo(() => FISCAL_YEAR_REGEX.test(fiscalYear), [fiscalYear]);

  useEffect(() => {
    if (!isFiscalYearValid) {
      history.replace(appUrls.donations().root());
    }
  }, [isFiscalYearValid, history]);

  const [selectingFiscalYear, setSelectingFiscalYear] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);

  const fetchDonationsFromApi = useCallback(() => {
    if (!isFiscalYearValid) {
      return;
    }

    api(async (api) => {
      setLoading(true);

      try {
        const fetchDonationsResponse = await api.fetchDonations(fiscalYear);
        setDonations(fetchDonationsResponse.donations);
      } finally {
        setLoading(false);
      }
    }, 'fetching donations');
  }, [api, fiscalYear, isFiscalYearValid]);

  const { path } = useRouteMatch();

  useEffect(() => {
    fetchDonationsFromApi();
  }, [fetchDonationsFromApi]);

  const handleChangeFiscalYear = () => {
    setSelectingFiscalYear(true);
  };

  const handleChangeFiscalYearClose = () => {
    setSelectingFiscalYear(false);
  };

  const handleFiscalYearSelected = (nextFiscalYear: string) => {
    history.push(appUrls.donations().forFiscalYear(nextFiscalYear));
  };

  const handleDonationSelected = (donationId: string) => {
    history.push(appUrls.donations().forDonation(fiscalYear, donationId));
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

      <FiscalYearSelector
        open={selectingFiscalYear}
        initialFiscalYear={fiscalYear}
        availableYears={availableFiscalYears}
        onFiscalYearSelected={handleFiscalYearSelected}
        onClose={handleChangeFiscalYearClose}
      />

      <Switch>
        <Route path={`${path}/:donationId`}>
          {isLoading ? <></> : <DonationsDrawerPage donations={donations} onDonationUpdated={handleDonationUpdated} />}
        </Route>
      </Switch>
    </Box>
  );
};
