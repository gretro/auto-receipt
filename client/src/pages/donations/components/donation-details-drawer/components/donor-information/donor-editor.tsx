import { Box, Button, Divider, Drawer, makeStyles, Paper, TextField, Theme, Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useFormik } from 'formik';
import React from 'react';
import * as Yup from 'yup';
import { PageHeader } from '../../../../../../components/page-header';
import { Address } from '../../../../../../models/address';
import { Donor } from '../../../../../../models/donor';
import { DonorEdit } from './donor-edit';

interface Props {
  open: boolean;
  busy: boolean;
  donationId: string | null | undefined;
  donor: Donor | null | undefined;
  onSave: (newValues: DonorEdit) => void;
  onClose: () => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  drawerContent: {
    display: 'flex',
    flexDirection: 'column',
    width: '50vw',
    height: '100vh',
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
    },
  },
  mainContent: {
    flex: 1,
    padding: `${theme.spacing(2)}px 0`,
    display: 'flex',
    flexDirection: 'column',
    '&> *:not(:last-child)': {
      marginBottom: theme.spacing(2),
    },
  },
  subTitle: {
    margin: `${theme.spacing(2)}px 0`,
  },
  divider: {
    margin: `0 ${theme.spacing(-2)}px`,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row-reverse',
    gap: `${theme.spacing(1)}px`,
    paddingTop: theme.spacing(2),
  },
}));

function getAddressSchema(value: Address): Yup.SchemaOf<any> {
  const required = value && Object.values(value).some(Boolean);

  if (required) {
    return Yup.object({
      line1: Yup.string().min(3).required(),
      line2: Yup.string().optional(),
      city: Yup.string().min(3).required(),
      state: Yup.string().min(2).required(),
      country: Yup.string().min(2).required(),
      postalCode: Yup.string().required(),
    });
  }

  return Yup.object({
    line1: Yup.string().min(3).optional(),
    line2: Yup.string().optional(),
    city: Yup.string().min(3).optional(),
    state: Yup.string().min(2).optional(),
    country: Yup.string().min(2).optional(),
    postalCode: Yup.string().optional(),
  });
}

export const DonorEditor: React.FC<Props> = (props) => {
  const styles = useStyles(props);

  const formik = useFormik<DonorEdit>({
    initialValues: {
      firstName: props.donor?.firstName || '',
      lastName: props.donor?.lastName || '',
      email: props.donor?.email || '',
      address: {
        line1: props.donor?.address?.line1 || '',
        line2: props.donor?.address?.line2 || '',
        city: props.donor?.address?.city || '',
        state: props.donor?.address?.state || '',
        postalCode: props.donor?.address?.postalCode || '',
        country: props.donor?.address?.country || '',
      },
    },
    onSubmit: (values) => {
      props.onSave(values);
    },
    validationSchema: Yup.object({
      firstName: Yup.string().min(3).optional(),
      lastName: Yup.string().min(3).required(),
      email: Yup.string().email().optional(),
      address: Yup.lazy(getAddressSchema),
    }),
  });

  const handleFormClose = () => {
    if (props.busy) {
      return;
    }

    if (formik.dirty) {
      const confirmed = window.confirm(
        'There are pending changes in this form. Are you certain you want to close it? All changes will be lost.',
      );
      if (!confirmed) {
        return;
      }
    }

    formik.resetForm({ values: formik.initialValues });
    props.onClose();
  };

  return (
    <Drawer open={props.open} anchor="right" onClose={handleFormClose}>
      <Paper className={styles.drawerContent} component="form" onSubmit={formik.handleSubmit as any}>
        <PageHeader
          pageTitle="Edit donor information"
          subTitle={`Donation ID: ${props.donationId || ''}`}
          smallTitle
          actionButtonIcon={<CloseIcon />}
          actionButtonLabel="Cancel"
          onActionButtonClicked={handleFormClose}
        ></PageHeader>
        <Box className={styles.mainContent}>
          <Typography variant="subtitle1">Contact information</Typography>
          <TextField
            label="First name"
            autoFocus
            disabled={props.busy}
            {...formik.getFieldProps('firstName')}
            error={!!formik.errors.firstName}
            helperText={formik.errors.firstName}
          />
          <TextField
            label="Last name"
            disabled={props.busy}
            {...formik.getFieldProps('lastName')}
            error={!!formik.errors.lastName}
            helperText={formik.errors.lastName}
          />
          <TextField
            label="Email"
            type="email"
            disabled={props.busy}
            {...formik.getFieldProps('email')}
            error={!!formik.errors.email}
            helperText={formik.errors.email}
          />

          <Typography variant="subtitle1" className={styles.subTitle}>
            Mailing address
          </Typography>
          <TextField
            label="Line 1"
            disabled={props.busy}
            {...formik.getFieldProps('address.line1')}
            error={!!formik.errors.address?.line1}
            helperText={formik.errors.address?.line1}
          />
          <TextField
            label="Line 2"
            disabled={props.busy}
            {...formik.getFieldProps('address.line2')}
            error={!!formik.errors.address?.line2}
            helperText={formik.errors.address?.line2}
          />
          <TextField
            label="City"
            disabled={props.busy}
            {...formik.getFieldProps('address.city')}
            error={!!formik.errors.address?.city}
            helperText={formik.errors.address?.city}
          />
          <TextField
            label="State"
            disabled={props.busy}
            {...formik.getFieldProps('address.state')}
            error={!!formik.errors.address?.state}
            helperText={formik.errors.address?.state}
          />
          <TextField
            label="Postal Code / Zip code"
            disabled={props.busy}
            {...formik.getFieldProps('address.postalCode')}
            error={!!formik.errors.address?.postalCode}
            helperText={formik.errors.address?.postalCode}
          />
          <TextField
            label="Country"
            disabled={props.busy}
            {...formik.getFieldProps('address.country')}
            error={!!formik.errors.address?.country}
            helperText={formik.errors.address?.country}
          />
        </Box>
        <Divider className={styles.divider} />
        <Box className={styles.actions}>
          <Button type="submit" variant="contained" color="primary" disabled={props.busy || !formik.dirty}>
            {props.busy ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={handleFormClose} disabled={props.busy}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Drawer>
  );
};
