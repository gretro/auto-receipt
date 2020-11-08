import { Card, CardContent, CardHeader, Grid, Typography } from '@material-ui/core';
import React from 'react';
import { DonationType } from '../../../../../../models/donation';
import { Payment } from '../../../../../../models/payment';
import { calculateDonationTotalAmount, getDonationCurrency } from '../../../../mappers/donations-mapper';

interface Props {
  donationType: DonationType;
  payments: Payment[];
}

export const PaymentInformation: React.FC<Props> = (props) => {
  const cardTitle =
    props.donationType === 'one-time' ? 'One time donation' : `Recurrent donation - ${props.payments.length} payments`;

  const currency = getDonationCurrency(props.payments);
  const amountDonated = calculateDonationTotalAmount(props.payments, (payment) => payment.amount);
  const receiptAmount = calculateDonationTotalAmount(props.payments, (payment) => payment.receiptAmount);
  // const paymentSource = props.payments?.length > 0 ? props.payments[0].source : '-';

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    currency,
    style: 'currency',
  });

  return (
    <Card variant="outlined">
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
            <Typography>-</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" component="span">
              Date
            </Typography>
            <Typography>-</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
