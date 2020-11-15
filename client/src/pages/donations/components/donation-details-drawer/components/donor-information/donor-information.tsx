import {
  Box,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import EditIcon from '@material-ui/icons/Edit';
import EmailIcon from '@material-ui/icons/Email';
import React from 'react';
import { useApi } from '../../../../../../api/api.hook';
import { FlowGridCard } from '../../../../../../components/FlowGrid';
import { Donation } from '../../../../../../models/donation';
import { Donor } from '../../../../../../models/donor';
import { mapDonorAddressMultiLine } from '../../../../mappers/donations-mapper';

interface Props {
  donationId?: string;
  donor: Donor | null | undefined;
  onDonationUpdated: (donation: Donation) => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  donorContent: {
    '& + &': {
      marginTop: theme.spacing(1),
    },
  },
}));

export const DonorInformation: React.FC<Props> = (props) => {
  const api = useApi();

  const handleSendMissingAddressEmail = () => {
    api(
      async (httpApi) => {
        const newDonation = await httpApi.sendCorrespondence(props.donationId || '', 'no-mailing-addr');
        props.onDonationUpdated(newDonation);
      },
      'sending mailing address notification',
      { showLoading: true, showSuccess: true },
    );
  };

  const styles = useStyles(props);

  const empty = <Typography>No donor information found</Typography>;

  const mailingAddress = mapDonorAddressMultiLine(props.donor?.address, 'No address on file');
  const content = (
    <>
      <Box className={styles.donorContent}>
        <Typography>{props.donor?.email}</Typography>
      </Box>
      <Box className={styles.donorContent}>
        {mailingAddress.map((line, index) => (
          <Typography key={index}>{line}</Typography>
        ))}
      </Box>
    </>
  );

  return (
    <FlowGridCard variant="outlined">
      <CardHeader
        title="Donor information"
        subheader={props.donor ? `${props.donor.lastName}, ${props.donor.firstName}` : null}
      ></CardHeader>
      <CardContent>{props.donor ? content : empty}</CardContent>
      <CardActions disableSpacing>
        <IconButton title="Edit donor information">
          <EditIcon />
        </IconButton>
        {props.donor?.email ? (
          <IconButton href={`mailto:${props.donor.email}`} target="_blank" title="Send an email">
            <EmailIcon />
          </IconButton>
        ) : null}
        {props.donor?.email && !props.donor.address ? (
          <IconButton title="Send missing address email" onClick={handleSendMissingAddressEmail}>
            <AnnouncementIcon />
          </IconButton>
        ) : null}
      </CardActions>
    </FlowGridCard>
  );
};
