import { Box, Button, Hidden, ListItemIcon, ListItemText, makeStyles, MenuItem } from '@material-ui/core';
import AnnouncementIcon from '@material-ui/icons/Announcement';
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

type SelectionAction = 'missing-addr';

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

  const [selectionAction, setSelectionAction] = useState<SelectionAction | null>(null);
  const [selectedDonations, setSelectedDonations] = useState<string[]>([]);
  const handleStartMissingAddress = () => {
    setSelectionAction('missing-addr');
  };

  const handleSelectionActionCancelled = () => {
    setSelectionAction(null);
  };

  const handleSelectionActionDone = () => {
    const activeAction = selectionAction;
    setSelectionAction(null);

    switch (activeAction) {
      case 'missing-addr': {
        api(
          async (httpApi) => {
            try {
              await httpApi.sendCorrespondenceInBulk(selectedDonations, 'no-mailing-addr');
            } catch (err) {
              setSelectionAction(activeAction);
              throw err;
            }
          },
          'sending missing address email',
          { showLoading: true, showSuccess: true },
        );
      }
    }
  };

  const handleDonationSelectionChanged = (donationIds: string[]): void => {
    setSelectedDonations(donationIds);
    console.log('Selection changed', donationIds);
  };

  const menuItems: React.ReactElement[] = [
    <Hidden key="actions.refresh" mdUp>
      <MenuItem disabled={isLoading} onClick={fetchDonationsFromApi}>
        <ListItemIcon>
          <RefreshIcon />
        </ListItemIcon>
        <ListItemText>Refresh</ListItemText>
      </MenuItem>
    </Hidden>,
    <Hidden key="actions.changeFiscalYear" mdUp>
      <MenuItem disabled={isLoading} onClick={handleChangeFiscalYear}>
        <ListItemIcon>
          <CalendarTodayIcon />
        </ListItemIcon>
        <ListItemText>Change fiscal year</ListItemText>
      </MenuItem>
    </Hidden>,
    <MenuItem key="actions.missing-addr" disabled={isLoading} onClick={handleStartMissingAddress}>
      <ListItemIcon>
        <AnnouncementIcon />
      </ListItemIcon>
      <ListItemText>Send missing address email</ListItemText>
    </MenuItem>,
  ];

  return (
    <Box className={styles.pageGrid}>
      <header className={styles.pageHeader}>
        <PageHeader pageTitle={`${fiscalYear} Donations`} hamburgerMenuItems={selectionAction ? undefined : menuItems}>
          {selectionAction ? (
            <>
              <Button
                color="primary"
                variant="contained"
                disabled={selectedDonations.length === 0}
                onClick={handleSelectionActionDone}
              >
                Done
              </Button>
              <Button variant="contained" onClick={handleSelectionActionCancelled}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Hidden smDown>
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<CalendarTodayIcon />}
                  onClick={handleChangeFiscalYear}
                >
                  Change fiscal year
                </Button>
              </Hidden>
              <Hidden smDown>
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  disabled={isLoading}
                  onClick={fetchDonationsFromApi}
                >
                  Refresh
                </Button>
              </Hidden>
            </>
          )}
        </PageHeader>
      </header>

      <div className={styles.pageContent}>
        <DonationsGrid
          isLoading={isLoading}
          donations={donations}
          onDonationSelected={handleDonationSelected}
          gridMode={selectionAction ? 'select' : 'view'}
          onDonationSelectionChanged={handleDonationSelectionChanged}
        />
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
