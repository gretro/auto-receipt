import { CardContent, CardHeader, makeStyles, Theme, Typography, useTheme } from '@material-ui/core';
import MarkunreadMailboxIcon from '@material-ui/icons/MarkunreadMailbox';
import SendIcon from '@material-ui/icons/Send';
import React, { useMemo } from 'react';
import { FlowGrid, FlowGridCard, FlowGridItem } from '../../../../components/FlowGrid';
import { formatCurrency, formatNumber } from '../../../../utils/formatters.utils';
import { GridDonation } from './grid-donation.model';

interface Props {
  mappedDonations: GridDonation[];
}

interface DonationsInfos {
  donationsCount: string;
  sentReceiptsCount: string;
  snailMailReceiptsCount: string;
  donationsTotal: string;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  multiInfoCard: {
    display: 'grid',
    gridAutoColumns: 'auto',
    gridAutoFlow: 'column',
    gap: `${theme.spacing(2)}px`,
    justifyContent: 'start',
  },
}));

export const DonationsCardCarousel: React.FC<Props> = (props) => {
  const donationsInfos = useMemo<DonationsInfos>(() => {
    const { sentReceipts, snailMailReceipts, totalAmount } = props.mappedDonations.reduce(
      (acc, donation) => {
        if (donation.receiptSentStatus === 'sent') {
          acc.sentReceipts++;
        }

        if (donation.receiptSentStatus === 'snail-mail') {
          acc.snailMailReceipts++;
        }

        acc.totalAmount = acc.totalAmount + donation.totalDonationAmount;

        return acc;
      },
      { sentReceipts: 0, snailMailReceipts: 0, totalAmount: 0 },
    );

    const currency = props.mappedDonations.length > 0 ? props.mappedDonations[0].donationCurrency : 'USD';

    return {
      donationsCount: formatNumber(props.mappedDonations.length, 0),
      sentReceiptsCount: formatNumber(sentReceipts, 0),
      snailMailReceiptsCount: formatNumber(snailMailReceipts, 0),
      donationsTotal: formatCurrency(totalAmount, currency),
    };
  }, [props.mappedDonations]);

  const theme = useTheme();
  const styles = useStyles(props);

  return (
    <FlowGrid columns={3} spacing={theme.spacing(2)}>
      <FlowGridItem>
        <FlowGridCard variant="outlined">
          <CardHeader subheader="Donations received" />
          <CardContent>
            <Typography component="span" variant="h4">
              {donationsInfos.donationsCount}
            </Typography>
          </CardContent>
        </FlowGridCard>
      </FlowGridItem>
      <FlowGridItem>
        <FlowGridCard variant="outlined">
          <CardHeader subheader="Receipts" />
          <CardContent className={styles.multiInfoCard}>
            <Typography component="span" variant="h4" title="Sent receipts (by email)">
              {donationsInfos.sentReceiptsCount} <SendIcon />
            </Typography>
            <Typography component="span" variant="h4" title="Receipts to be sent (or sent) by snail mail">
              {donationsInfos.snailMailReceiptsCount} <MarkunreadMailboxIcon />
            </Typography>
          </CardContent>
        </FlowGridCard>
      </FlowGridItem>
      <FlowGridItem>
        <FlowGridCard variant="outlined">
          <CardHeader subheader="Total donation amount" />
          <CardContent>
            <Typography component="span" variant="h4">
              {donationsInfos.donationsTotal}
            </Typography>
          </CardContent>
        </FlowGridCard>
      </FlowGridItem>
    </FlowGrid>
  );
};
