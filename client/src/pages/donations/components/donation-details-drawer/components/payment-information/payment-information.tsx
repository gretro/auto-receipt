import { CardActions, CardContent, CardHeader, Grid, IconButton, Typography } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import React from 'react';
import { FlowGridCard } from '../../../../../../components/FlowGrid';
import { DonationType } from '../../../../../../models/donation';
import { Payment } from '../../../../../../models/payment';
import {
  calculateDonationTotalAmount,
  formatDateRange,
  getDonationCurrency,
  getPaymentDateRange,
  getPaymentSource,
} from '../../../../mappers/donations-mapper';

interface Props {
  donationType: DonationType;
  payments: Payment[];
}

export const PaymentInformation: React.FC<Props> = (props) => {
  const cardTitle =
    props.donationType === 'one-time' ? 'One time donation' : `Recurrent donation - ${props.payments.length} payments`;

  const currency = getDonationCurrency(props.payments, 'USD');
  const amountDonated = calculateDonationTotalAmount(props.payments, (payment) => payment.amount);
  const receiptAmount = calculateDonationTotalAmount(props.payments, (payment) => payment.receiptAmount);
  const dateRange = getPaymentDateRange(props.payments);
  const formattedDateRange = formatDateRange(dateRange);
  const paymentSource = getPaymentSource(props.payments);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
  });

  return (
    <FlowGridCard variant="outlined">
      <CardHeader title="Payment information" subheader={cardTitle}></CardHeader>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" component="span">
              Amount donated
            </Typography>
            <Typography>{currencyFormatter.format(amountDonated)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" component="span">
              Receipt amount
            </Typography>
            <Typography>{currencyFormatter.format(receiptAmount)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" component="span">
              Source
            </Typography>
            <Typography>{paymentSource.sourceName}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" component="span">
              Date
            </Typography>
            <Typography>{formattedDateRange}</Typography>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        {paymentSource.link ? (
          <IconButton title="View payment details" href={paymentSource.link} target="_blank">
            <OpenInNewIcon />
          </IconButton>
        ) : null}
      </CardActions>
    </FlowGridCard>
  );
};
