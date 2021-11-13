import {
  Box,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  makeStyles,
  Theme,
  Tooltip,
  Typography,
} from '@material-ui/core';
import AccessAlarmIcon from '@material-ui/icons/AccessAlarm';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import EditIcon from '@material-ui/icons/Edit';
import EmailIcon from '@material-ui/icons/Email';
import NotificationsPausedIcon from '@material-ui/icons/NotificationsPaused';
import React, { useState } from 'react';
import { useApi } from '../../../../../../api/api.hook';
import { FlowGridCard } from '../../../../../../components/FlowGrid';
import { DeepPartial } from '../../../../../../models/deep-partial';
import { Donation } from '../../../../../../models/donation';
import { Donor } from '../../../../../../models/donor';
import { formatDate } from '../../../../../../utils/formatters.utils';
import { getLastReminderSent, mapDonorAddressMultiLine } from '../../../../mappers/donations-mapper';
import { DonorEdit } from './donor-edit';
import { DonorEditor } from './donor-editor';

interface Props {
  donation?: Donation | null | undefined;
  onDonationUpdated: (donation: Donation) => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  donorContent: {
    '& + &': {
      marginTop: theme.spacing(1),
    },
  },
  textWithIcon: {
    display: 'flex',
    alignItems: 'center',
  },
}));

export const DonorInformation: React.FC<Props> = (props) => {
  const api = useApi();
  const styles = useStyles(props);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [isSaving, setSaving] = useState<boolean>(false);

  const handleSendMissingAddressEmail = () => {
    api(
      async (httpApi) => {
        const newDonation = await httpApi.sendCorrespondence(props.donation?.id || '', 'no-mailing-addr');
        props.onDonationUpdated(newDonation);
      },
      'sending mailing address notification',
      { showLoading: true, showSuccess: true },
    );
  };

  const handleSendReminderEmail = () => {
    api(
      async (httpApi) => {
        const newDonation = await httpApi.sendCorrespondence(props.donation?.id || '', 'reminder-mailing-addr');
        props.onDonationUpdated(newDonation);
      },
      'sending reminder email',
      { showLoading: true, showSuccess: true },
    );
  };

  const handleDonorSave = (newValues: DonorEdit) => {
    console.log('Handling donor edit', newValues);
    setSaving(true);

    const hasAddress = newValues.address && Object.values(newValues.address).some(Boolean);
    const donor: DeepPartial<Donor> = {
      firstName: newValues.firstName || undefined,
      lastName: newValues.lastName || undefined,
      email: newValues.email || undefined,
      address: hasAddress
        ? {
            line1: newValues.address.line1 || undefined,
            line2: newValues.address.line2 || null,
            city: newValues.address.city || undefined,
            state: newValues.address.state || undefined,
            country: newValues.address.country || undefined,
            postalCode: newValues.address.postalCode || undefined,
          }
        : undefined,
    };

    // TODO: Offer the option to emit a revised receipt in the future
    // Generate the receipt if we had no address and we now have one
    const generateReceipt = props.donation?.type !== 'recurrent' && !props.donation?.donor.address && !!donor.address;

    api(
      async (httpApi) => {
        try {
          const newDonation = await httpApi.patchDonation(
            props.donation?.id || '',
            {
              donor,
            },
            generateReceipt,
          );

          props.onDonationUpdated(newDonation);
          setEditing(false);
        } finally {
          setSaving(false);
        }
      },
      'saving donor information',
      { showLoading: true, showSuccess: true },
    );
  };

  const handleToggleEdit = () => {
    setEditing((current) => !current);
  };

  const empty = <Typography>No donor information found</Typography>;

  const lastReminderSentAt = getLastReminderSent(props.donation);
  const mailingAddress = mapDonorAddressMultiLine(props.donation?.donor?.address, [
    'No address on file',
    `Last reminder sent on: ${formatDate(lastReminderSentAt)}`,
  ]);
  const content = (
    <>
      <Box className={styles.donorContent}>
        <Typography className={styles.textWithIcon}>
          {props.donation?.donor?.email}
          &nbsp;
          {!props.donation?.emailReceipt && (
            <Tooltip title="No receipts will be sent to this email address">
              <NotificationsPausedIcon />
            </Tooltip>
          )}
        </Typography>
      </Box>
      <Box className={styles.donorContent}>
        {mailingAddress.map((line, index) => (
          <Typography key={index}>{line}</Typography>
        ))}
      </Box>
    </>
  );

  const donorName = props.donation?.donor.firstName
    ? `${props.donation?.donor.lastName}, ${props.donation?.donor.firstName}`
    : props.donation?.donor.lastName ?? null;

  return (
    <>
      <FlowGridCard variant="outlined">
        <CardHeader title="Donor information" subheader={donorName}></CardHeader>
        <CardContent>{props.donation?.donor ? content : empty}</CardContent>
        <CardActions disableSpacing>
          <IconButton title="Edit donor information" onClick={handleToggleEdit}>
            <EditIcon />
          </IconButton>
          {props.donation?.donor?.email ? (
            <IconButton href={`mailto:${props.donation?.donor.email}`} target="_blank" title="Send an email">
              <EmailIcon />
            </IconButton>
          ) : null}
          {props.donation?.donor?.email && !props.donation?.donor.address ? (
            <IconButton title="Send missing address email" onClick={handleSendMissingAddressEmail}>
              <AnnouncementIcon />
            </IconButton>
          ) : null}
          {props.donation?.donor.email && !props.donation.donor.address ? (
            <IconButton title="Send missing address reminder email" onClick={handleSendReminderEmail}>
              <AccessAlarmIcon />
            </IconButton>
          ) : null}
        </CardActions>
      </FlowGridCard>

      <DonorEditor
        open={isEditing}
        busy={isSaving}
        donationId={props.donation?.id}
        donor={props.donation?.donor}
        onSave={handleDonorSave}
        onClose={handleToggleEdit}
      />
    </>
  );
};
