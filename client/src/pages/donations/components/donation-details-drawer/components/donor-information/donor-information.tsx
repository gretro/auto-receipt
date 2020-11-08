import { Card, CardActions, CardContent, CardHeader, IconButton, Typography } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import EmailIcon from '@material-ui/icons/Email';
import React from 'react';
import { Donor } from '../../../../../../models/donor';
import { mapDonorAddress } from '../../../../mappers/donations-mapper';

interface Props {
  donor: Donor | null | undefined;
}

export const DonorInformation: React.FC<Props> = (props) => {
  const empty = <Typography>No donor information found</Typography>;

  const content = (
    <>
      <Typography>{mapDonorAddress(props.donor?.address, 'No address on file')}</Typography>
      <Typography>{props.donor?.email}</Typography>
    </>
  );

  return (
    <Card variant="outlined">
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
      </CardActions>
    </Card>
  );
};
