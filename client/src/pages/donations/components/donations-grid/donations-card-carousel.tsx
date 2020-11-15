import { CardContent, CardHeader, Typography, useTheme } from '@material-ui/core';
import React, { useMemo } from 'react';
import { FlowGrid, FlowGridCard, FlowGridItem } from '../../../../components/FlowGrid';
import { formatCurrency, formatNumber } from '../../../../utils/formatters.utils';
import { GridDonation } from './grid-donation.model';

interface Props {
  mappedDonations: GridDonation[];
}

interface DonationsInfos {
  donationsCount: string;
  donationsTotal: string;
}

export const DonationsCardCarousel: React.FC<Props> = (props) => {
  const donationsInfos = useMemo<DonationsInfos>(() => {
    const total = props.mappedDonations.reduce((acc, donation) => {
      return acc + donation.totalDonationAmount;
    }, 0);

    const currency = props.mappedDonations.length > 0 ? props.mappedDonations[0].donationCurrency : 'USD';

    return {
      donationsCount: formatNumber(props.mappedDonations.length, 0),
      donationsTotal: formatCurrency(total, currency),
    };
  }, [props.mappedDonations]);

  const theme = useTheme();

  return (
    <FlowGrid columns={2} spacing={theme.spacing(2)}>
      <FlowGridItem>
        <FlowGridCard variant="outlined">
          <CardHeader subheader="Number of donations" />
          <CardContent>
            <Typography variant="h4">{donationsInfos.donationsCount}</Typography>
          </CardContent>
        </FlowGridCard>
      </FlowGridItem>
      <FlowGridItem>
        <FlowGridCard variant="outlined">
          <CardHeader subheader="Total donation amount" />
          <CardContent>
            <Typography variant="h4">{donationsInfos.donationsTotal}</Typography>
          </CardContent>
        </FlowGridCard>
      </FlowGridItem>
    </FlowGrid>
  );
};
