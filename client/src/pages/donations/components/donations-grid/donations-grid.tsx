import { Box, makeStyles, TextField, Theme, Tooltip, Typography } from '@material-ui/core';
import { CellParams, ColDef, DataGrid, RowParams } from '@material-ui/data-grid';
import DescriptionIcon from '@material-ui/icons/Description';
import React, { ChangeEvent, useMemo, useState } from 'react';
import { Donation } from '../../../../models/donation';
import { mapDonationToGridDonation } from '../../mappers/donations-mapper';
import { GridDonation } from './grid-donation.model';

interface Props {
  isLoading?: boolean;
  donations: Donation[];
  onDonationSelected: (donationId: string) => void;
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
    gridTemplateRows: 'auto 1fr',
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
  const formatter = new Intl.NumberFormat('en-US', {
    currency,
    useGrouping: true,
    style: 'currency',
  });
  return formatter.format(params.value);
};

const columns: ColDef[] = [
  {
    field: 'created' as keyof GridDonation,
    headerName: 'Donation date',
    valueFormatter: (params) => {
      const date = new Date(params.value as string);
      if (isNaN(date.getTime())) {
        return '-';
      }

      const dtFormatter = new Intl.DateTimeFormat('en-CA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
      return dtFormatter.format(date);
    },
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
    field: 'donationCurrency' as keyof GridDonation,
    headerName: 'Currency',
    ...DEFAULT_COL_DEF,
  },
  {
    field: 'donationReason' as keyof GridDonation,
    headerName: 'Reason for donation',
    ...DEFAULT_COL_DEF,
    width: LARGE_COL_WIDTH,
  },
  {
    field: 'donationType' as keyof GridDonation,
    headerName: 'Type',
    ...DEFAULT_COL_DEF,
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
  const [filter, setFilter] = useState<string>('');

  const isEmpty = !props.isLoading && props.donations.length === 0;
  const styles = useStyles(props);

  const mappedDonations = useMemo(() => props.donations.map(mapDonationToGridDonation), [props.donations]);

  // TODO: Improve search. We should debounce the search
  const filteredMappedDonations = useMemo(() => {
    return mappedDonations.filter((donation) => donation.search.indexOf(filter.toLowerCase()) > -1);
  }, [filter, mappedDonations]);

  const handleFilterChanged = (event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const handleRowClicked = (rowParam: RowParams) => {
    const rowId = rowParam.getValue('id');
    props.onDonationSelected(rowId as string);
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
      <TextField label="Search by name or email" variant="outlined" value={filter} onChange={handleFilterChanged} />
      <Box>
        <DataGrid
          rows={filteredMappedDonations}
          columns={columns}
          disableSelectionOnClick
          disableColumnResize
          onRowClick={handleRowClicked}
          loading={props.isLoading}
        ></DataGrid>
      </Box>
    </Box>
  );
};
