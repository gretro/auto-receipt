import { Box, Button, Hidden, ListItemIcon, ListItemText, makeStyles, MenuItem } from '@material-ui/core';
import AccessAlarmIcon from '@material-ui/icons/AccessAlarm';
import AddIcon from '@material-ui/icons/Add';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import GetAppIcon from '@material-ui/icons/GetApp';
import ReceiptIcon from '@material-ui/icons/Receipt';
import RefreshIcon from '@material-ui/icons/Refresh';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Switch, useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { useApi } from '../../api/api.hook';
import { appUrls } from '../../app-urls';
import { PageHeader } from '../../components/page-header';
import { Donation } from '../../models/donation';
import { downloadBlobFile } from '../../utils/download.utils';
import { DonationsGrid } from './components/donations-grid/donations-grid';
import { FiscalYearSelector } from './components/fiscal-year-selector/fiscal-year-selector';
import { DonationsCreateDrawerPage } from './donations-create-drawer.page';
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

type SelectionAction = 'missing-addr' | 'reminder-addr' | 'generate-receipt' | 'download-receipts';

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

  const shouldReloadData = (history.location.state as any)?.reload;
  useEffect(() => {
    if (shouldReloadData) {
      fetchDonationsFromApi();
      window.history.replaceState({}, document.title);
    }
  }, [shouldReloadData]);

  const { path } = useRouteMatch();

  useEffect(() => {
    fetchDonationsFromApi();
  }, [fetchDonationsFromApi]);

  const handleChangeFiscalYear = () => {
    setSelectingFiscalYear(true);
  };

  const handleNewDonation = () => {
    history.push(appUrls.donations().createDonation(fiscalYear));
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

  const handleSelectionActionStarted = (action: SelectionAction) => () => {
    setSelectionAction(action);
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
            await httpApi.sendCorrespondenceInBulk(selectedDonations, 'no-mailing-addr');
          },
          'sending missing address email',
          { showLoading: true, showSuccess: true },
        );

        break;
      }

      case 'reminder-addr': {
        api(
          async (httpApi) => {
            await httpApi.sendCorrespondenceInBulk(selectedDonations, 'reminder-mailing-addr');
          },
          'sending reminder emails',
          { showLoading: true, showSuccess: true },
        );

        break;
      }

      case 'generate-receipt': {
        api(
          async (httpApi) => {
            const request = selectedDonations
              .map((donationId) => {
                const donation = donations.find((donation) => donation.id === donationId);
                if (!donation) {
                  return null;
                }

                return {
                  donationId,
                  sendEmail: !!donation.donor.email,
                };
              })
              .filter(Boolean) as { donationId: string; sendEmail: boolean }[];

            await httpApi.forceGenerateReceipt(request);
          },
          'generating receipts',
          { showLoading: true, showSuccess: true },
        );

        break;
      }

      case 'download-receipts': {
        api(
          async (httpApi) => {
            const toDownload = selectedDonations
              .map((donationId) => {
                const donation = donations.find((donation) => donation.id === donationId);
                if (!donation) {
                  return null;
                }

                const sortedDocuments = [...donation.documents].sort(
                  (left, right) => left.created.getTime() - right.created.getTime(),
                );
                const documentId = sortedDocuments.length > 0 ? sortedDocuments[0].id : null;

                if (!documentId) {
                  return null;
                }

                return {
                  donationId,
                  documentId,
                };
              })
              .filter(Boolean) as { donationId: string; documentId: string }[];

            const fileContent = await httpApi.bulkDownloadReceipts(toDownload);
            downloadBlobFile(fileContent, 'receipts_export.zip');
          },
          'downloading receipts',
          { showSuccess: true, showLoading: true },
        );
        break;
      }
    }
  };

  const handleDonationSelectionChanged = (donationIds: string[]): void => {
    setSelectedDonations(donationIds);
    console.log('Selection changed', donationIds);
  };

  const filteredDonations = useMemo(() => {
    switch (selectionAction) {
      case 'missing-addr':
        return filterDonationsForMissingAddress(donations);

      case 'reminder-addr':
        return filterDonationsForMissingAddress(donations);

      case 'generate-receipt':
        return filterDonationsForMissingReceipt(donations);

      case 'download-receipts':
        return filterDonationsForDownloadingReceipts(donations);

      default:
        return donations;
    }
  }, [donations, selectionAction]);

  const menuItems: React.ReactElement[] = [
    <Hidden key="actions.newDonation" mdUp>
      <MenuItem disabled={isLoading} onClick={handleNewDonation}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText>New donation</ListItemText>
      </MenuItem>
    </Hidden>,
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
    <MenuItem key="actions.missing-addr" disabled={isLoading} onClick={handleSelectionActionStarted('missing-addr')}>
      <ListItemIcon>
        <AnnouncementIcon />
      </ListItemIcon>
      <ListItemText>Send missing address email</ListItemText>
    </MenuItem>,
    <MenuItem key="actions.reminder-addr" disabled={isLoading} onClick={handleSelectionActionStarted('reminder-addr')}>
      <ListItemIcon>
        <AccessAlarmIcon />
      </ListItemIcon>
      <ListItemText>Send missing address reminder email</ListItemText>
    </MenuItem>,
    <MenuItem
      key="actions.generate-receipt"
      disabled={isLoading}
      onClick={handleSelectionActionStarted('generate-receipt')}
    >
      <ListItemIcon>
        <ReceiptIcon />
      </ListItemIcon>
      <ListItemText>Generate missing receipt</ListItemText>
    </MenuItem>,
    <MenuItem
      key="actions.download-receipts"
      disabled={isLoading}
      onClick={handleSelectionActionStarted('download-receipts')}
    >
      <ListItemIcon>
        <GetAppIcon />
      </ListItemIcon>
      <ListItemText>Download receipts</ListItemText>
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
                <Button color="primary" variant="contained" startIcon={<AddIcon />} onClick={handleNewDonation}>
                  New donation
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
          donations={filteredDonations}
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
        <Route path={`${path}/new`}>
          <DonationsCreateDrawerPage />
        </Route>
        <Route path={`${path}/:donationId`}>
          {isLoading ? <></> : <DonationsDrawerPage donations={donations} onDonationUpdated={handleDonationUpdated} />}
        </Route>
      </Switch>
    </Box>
  );
};

function filterDonationsForMissingAddress(donations: Donation[]): Donation[] {
  return donations.filter((donation) => !donation.donor.address && donation.donor.email);
}

function filterDonationsForMissingReceipt(donations: Donation[]): Donation[] {
  return donations.filter((donation) => donation.donor.address && (donation.documents || []).length === 0);
}

function filterDonationsForDownloadingReceipts(donations: Donation[]): Donation[] {
  return donations.filter((donation) => (donation.documents || []).length > 0);
}
