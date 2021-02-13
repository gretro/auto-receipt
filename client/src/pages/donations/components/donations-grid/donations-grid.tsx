import { Box, debounce, makeStyles, TextField, Theme, Tooltip, Typography } from '@material-ui/core';
import { CellParams, ColDef, DataGrid, RowParams, SelectionChangeParams, SortModel } from '@material-ui/data-grid';
import DescriptionIcon from '@material-ui/icons/Description';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import LooksOneIcon from '@material-ui/icons/LooksOne';
import MarkunreadMailboxIcon from '@material-ui/icons/MarkunreadMailbox';
import RotateRightIcon from '@material-ui/icons/RotateRight';
import SendIcon from '@material-ui/icons/Send';
import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Donation } from '../../../../models/donation';
import { formatCurrency, formatDate } from '../../../../utils/formatters.utils';
import { formatDonationType, mapDonationToGridDonation } from '../../mappers/donations-mapper';
import { DonationsCardCarousel } from './donations-card-carousel';
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
      title = 'To be sent by snail mail';
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

export const DonationsGrid: React.FC<Props> = (props) => {
  const [rawFilter, setRawFilter] = useState<string>('');
  const [filter, setFilter] = useState<string>('');

  const isEmpty = !props.isLoading && props.donations.length === 0;
  const styles = useStyles(props);

  const mappedDonations = useMemo(() => props.donations.map(mapDonationToGridDonation), [props.donations]);

  const filteredMappedDonations = useMemo(() => {
    return mappedDonations.filter((donation) => donation.search.indexOf(filter.toLowerCase()) > -1);
  }, [filter, mappedDonations]);

  const handleFilterChangedRef = useRef(
    debounce((nextValue: string) => {
      setFilter(nextValue);
    }, 250),
  );

  const handleRawFilterChanged = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setRawFilter(value);
    handleFilterChangedRef.current(value);
  };

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
    const donationIds = params.rows.map((row) => String(row.id));
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
      <TextField
        label="Search by name or email"
        variant="outlined"
        value={rawFilter}
        onChange={handleRawFilterChanged}
      />
      <Box>
        <DataGrid
          rows={filteredMappedDonations}
          columns={columns}
          sortModel={defaultSortModel}
          disableSelectionOnClick
          disableColumnResize
          onRowClick={handleRowClicked}
          loading={props.isLoading}
          checkboxSelection={props.gridMode === 'select'}
          onSelectionChange={handleDonationSelectionChanged}
        ></DataGrid>
      </Box>
    </Box>
  );
};
