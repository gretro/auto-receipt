import { Box, makeStyles, Theme, Tooltip, Typography } from '@material-ui/core';
import { CellParams, ColDef, DataGrid, RowParams, SelectionChangeParams, SortModel } from '@material-ui/data-grid';
import DescriptionIcon from '@material-ui/icons/Description';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import LooksOneIcon from '@material-ui/icons/LooksOne';
import MarkunreadMailboxIcon from '@material-ui/icons/MarkunreadMailbox';
import RotateRightIcon from '@material-ui/icons/RotateRight';
import SendIcon from '@material-ui/icons/Send';
import React, { useMemo, useState } from 'react';
import { Donation } from '../../../../models/donation';
import { formatCurrency, formatDate } from '../../../../utils/formatters.utils';
import { formatDonationType, mapDonationToGridDonation } from '../../mappers/donations-mapper';
import { DonationsCardCarousel } from './donations-card-carousel';
import { FilterBar, QuickFilter } from './filter-bar';
import { GridDonation, ReceiptSentStatus } from './grid-donation.model';

interface Props {
  isLoading?: boolean;
  donations: Donation[];
  onDonationSelected: (donationId: string) => void;
  gridMode: 'view' | 'select';
  onDonationSelectionChanged: (selectedDonationIds: string[]) => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  center: {
    alignSelf: 'center',
    justifySelf: 'center',
    display: 'grid',
    justifyItems: 'center',
    gap: `${theme.spacing(1)}px`,
  },
  notFoundIcon: {
    height: theme.spacing(20),
    width: theme.spacing(20),
  },
  content: {
    display: 'grid',
    gridTemplateRows: 'auto auto 1fr',
    gap: `${theme.spacing(2)}px`,
  },
}));

const LARGE_COL_WIDTH = 250;
const XLARGE_COL_WIDTH = 400;

const withTooltipRenderer: ColDef['renderCell'] = (params: CellParams) => {
  const displayValue = params.colDef?.valueFormatter
    ? params.colDef.valueFormatter(params)
    : params.value?.toString() || '';

  return (
    <Tooltip title={displayValue || ''}>
      <Box width="100%">{displayValue}</Box>
    </Tooltip>
  );
};

const receiptSentStatusRenderer: ColDef['renderCell'] = (params: CellParams) => {
  const value = params.value as ReceiptSentStatus;
  let title: string;
  let icon: React.ReactElement | null = null;

  switch (value) {
    case 'sent':
      title = 'Sent';
      icon = <SendIcon />;
      break;

    case 'waiting-to-be-sent':
      title = 'Waiting to be sent';
      icon = <HourglassEmptyIcon />;
      break;

    case 'snail-mail':
      title = 'Snail mail';
      icon = <MarkunreadMailboxIcon />;
      break;

    default:
      title = 'No receipt';
      icon = null;
      break;
  }

  return (
    <Tooltip title={title}>
      <Box width="100%" display="flex" alignItems="center" justifyContent="center">
        {icon ?? <Box />}
      </Box>
    </Tooltip>
  );
};

const withDonationTypeRenderer: ColDef['renderCell'] = (params: CellParams) => {
  const icon = params.value === 'recurrent' ? <RotateRightIcon /> : <LooksOneIcon />;
  const displayValue = params.colDef?.valueFormatter
    ? params.colDef.valueFormatter(params)
    : params.value?.toString() || '';

  return (
    <Tooltip title={displayValue}>
      <Box width="100%" display="flex" alignItems="center" justifyContent="center">
        {icon}
      </Box>
    </Tooltip>
  );
};

const DEFAULT_COL_DEF: Partial<ColDef> = {
  sortable: true,
  width: 150,
  renderCell: withTooltipRenderer,
};

const currencyFormatter = (params: CellParams) => {
  if (typeof params.value !== 'number') {
    return params.value;
  }

  const currency: any = params.getValue('donationCurrency' as keyof GridDonation) || 'USD';
  return formatCurrency(params.value, currency);
};

const columns: ColDef[] = [
  {
    field: 'donationType' as keyof GridDonation,
    headerName: 'Type',
    sortable: true,
    width: 75,
    renderCell: withDonationTypeRenderer,
    valueFormatter: (params) => formatDonationType(params.value as any),
  },
  {
    field: 'created' as keyof GridDonation,
    headerName: 'Donation date',
    valueFormatter: (params) => formatDate(params.value as string),
    ...DEFAULT_COL_DEF,
    width: LARGE_COL_WIDTH,
  },
  {
    field: 'donorLastName' as keyof GridDonation,
    headerName: 'Last name / Organization',
    ...DEFAULT_COL_DEF,
    width: LARGE_COL_WIDTH,
  },
  {
    field: 'donorFirstName' as keyof GridDonation,
    headerName: 'First name',
    ...DEFAULT_COL_DEF,
    width: LARGE_COL_WIDTH,
  },
  {
    field: 'donorEmail' as keyof GridDonation,
    headerName: 'Email',
    ...DEFAULT_COL_DEF,
    width: LARGE_COL_WIDTH,
  },
  {
    field: 'totalDonationAmount' as keyof GridDonation,
    headerName: 'Donation amount',
    ...DEFAULT_COL_DEF,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: currencyFormatter,
  },
  {
    field: 'totalReceiptAmount' as keyof GridDonation,
    headerName: 'Receipt amount',
    ...DEFAULT_COL_DEF,
    headerAlign: 'right',
    align: 'right',
    valueFormatter: currencyFormatter,
  },
  {
    field: 'receiptSentStatus' as keyof GridDonation,
    headerName: 'Receipt sent',
    width: 115,
    renderCell: receiptSentStatusRenderer,
  },
  {
    field: 'donationReason' as keyof GridDonation,
    headerName: 'Reason for donation',
    ...DEFAULT_COL_DEF,
    width: LARGE_COL_WIDTH,
  },
  {
    field: 'paymentsCount' as keyof GridDonation,
    headerName: 'Payments',
    ...DEFAULT_COL_DEF,
    headerAlign: 'right',
    align: 'right',
  },
  {
    field: 'donorAddress' as keyof GridDonation,
    headerName: 'Address',
    ...DEFAULT_COL_DEF,
    width: XLARGE_COL_WIDTH,
  },
  {
    field: 'donorCountry' as keyof GridDonation,
    headerName: 'Country',
    ...DEFAULT_COL_DEF,
  },
  {
    field: 'documentsCount' as keyof GridDonation,
    headerName: 'Receipts',
    ...DEFAULT_COL_DEF,
    headerAlign: 'right',
    align: 'right',
  },
  {
    field: 'correspondencesCount' as keyof GridDonation,
    headerName: 'Emails sent',
    ...DEFAULT_COL_DEF,
    headerAlign: 'right',
    align: 'right',
  },
];

interface QuickFilterWithFn extends QuickFilter {
  filterFn: (donation: GridDonation) => boolean;
}

const QUICK_FILTERS: QuickFilterWithFn[] = [
  {
    id: 'missing-address',
    label: 'Donations with missing address',
    filterFn: (donation) => !donation.donorAddress,
  },
  {
    id: 'snail-mail-donations',
    label: 'Donations to be sent by snail mail',
    filterFn: (donation) => donation.receiptSentStatus === 'snail-mail',
  },
  {
    id: 'one-time-donations',
    label: 'One time donations',
    filterFn: (donation) => donation.donationType === 'one-time',
  },
  {
    id: 'recurrent-donations',
    label: 'Recurrent donations',
    filterFn: (donation) => donation.donationType === 'recurrent',
  },
];

export const DonationsGrid: React.FC<Props> = (props) => {
  const [textFilter, setTextFilter] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const isEmpty = !props.isLoading && props.donations.length === 0;
  const styles = useStyles(props);

  const mappedDonations = useMemo(() => props.donations.map(mapDonationToGridDonation), [props.donations]);

  const filteredMappedDonations = useMemo(() => {
    const quickFilterFn = QUICK_FILTERS.find((filter) => filter.id === quickFilter)?.filterFn || (() => true);
    const textFilterFn = textFilter
      ? (donation: GridDonation) => donation.search.indexOf(textFilter.toLowerCase()) > -1
      : () => true;

    return mappedDonations.filter(textFilterFn).filter(quickFilterFn);
  }, [textFilter, quickFilter, mappedDonations]);

  const handleRowClicked = (rowParam: RowParams) => {
    if (props.gridMode !== 'view') {
      return;
    }

    const rowId = rowParam.getValue('id');
    props.onDonationSelected(rowId as string);
  };

  const defaultSortModel: SortModel = [
    {
      field: 'created' as keyof GridDonation,
      sort: 'desc',
    },
  ];

  const handleDonationSelectionChanged = (params: SelectionChangeParams) => {
    const donationIds = params.rowIds.map((rowId) => String(rowId));
    props.onDonationSelectionChanged(donationIds);
  };

  const empty = (
    <Box className={styles.center}>
      <DescriptionIcon className={styles.notFoundIcon} color="primary" />
      <Typography>No donations found for this fiscal year</Typography>
    </Box>
  );

  return isEmpty ? (
    empty
  ) : (
    <Box className={styles.content}>
      <DonationsCardCarousel mappedDonations={mappedDonations} />
      <FilterBar
        quickFilters={QUICK_FILTERS}
        onTextFilterChanged={setTextFilter}
        onQuickFilterChanged={setQuickFilter}
      />
      <Box>
        <DataGrid
          rows={filteredMappedDonations}
          columns={columns}
          sortModel={defaultSortModel}
          disableSelectionOnClick
          disableColumnFilter
          disableColumnMenu
          onRowClick={handleRowClicked}
          loading={props.isLoading}
          checkboxSelection={props.gridMode === 'select'}
          onSelectionChange={handleDonationSelectionChanged}
        ></DataGrid>
      </Box>
    </Box>
  );
};
