import { Box, Button, Grid, makeStyles, TextField, Theme, Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useFormik } from 'formik';
import React from 'react';
import * as Yup from 'yup';
import { ContextualDrawer } from '../../../../../../components/ContextualDrawer';
import { PageHeader } from '../../../../../../components/page-header';
import { Address } from '../../../../../../models/address';
import { Donor } from '../../../../../../models/donor';
import { getMinMsg, requiredMsg } from '../../../../../../strings/validation.common';
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
  actions: {
    display: 'flex',
    flexDirection: 'row-reverse',
    gap: `${theme.spacing(1)}px`,
    paddingTop: theme.spacing(2),
  },
}));

function getAddressSchema(value: Address): Yup.Schema<any> {
  const required = value && Object.values(value).some(Boolean);

  if (required) {
    return Yup.object({
      line1: Yup.string().min(3, getMinMsg(3)).required(requiredMsg),
      line2: Yup.string().optional(),
      city: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
      state: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
      country: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
      postalCode: Yup.string().required(requiredMsg),
    });
  }

  return Yup.object({
    line1: Yup.string().min(3, getMinMsg(3)).optional(),
    line2: Yup.string().optional(),
    city: Yup.string().min(3, getMinMsg(3)).optional(),
    state: Yup.string().min(2, getMinMsg(2)).optional(),
    country: Yup.string().min(2, getMinMsg(2)).optional(),
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
      if (props.busy) {
        return;
      }

      props.onSave(values);
    },
    validationSchema: Yup.object({
      firstName: Yup.string().min(2, getMinMsg(2)).optional(),
      lastName: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
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

  const headerEl = (
    <PageHeader
      pageTitle="Edit donor information"
      subTitle={`Donation ID: ${props.donationId || ''}`}
      smallTitle
      actionButtonIcon={<CloseIcon />}
      actionButtonLabel="Cancel"
      onActionButtonClicked={handleFormClose}
    ></PageHeader>
  );

  const footerEl = (
    <Box className={styles.actions}>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={props.busy || !formik.dirty || !formik.isValid}
      >
        {props.busy ? 'Saving...' : 'Save'}
      </Button>
      <Button onClick={handleFormClose} disabled={props.busy}>
        Cancel
      </Button>
    </Box>
  );

  return (
    <ContextualDrawer
      drawerLevel={1}
      open={props.open}
      onDrawerClose={handleFormClose}
      surfaceComponent="form"
      SurfaceProps={{
        onSubmit: formik.handleSubmit as any,
      }}
      header={headerEl}
      footer={footerEl}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2">
            Contact information
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First name"
            autoFocus
            disabled={props.busy}
            {...formik.getFieldProps('firstName')}
            error={!!formik.errors.firstName}
            helperText={formik.errors.firstName}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last name / Organization name *"
            disabled={props.busy}
            {...formik.getFieldProps('lastName')}
            error={!!formik.errors.lastName}
            helperText={formik.errors.lastName}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            disabled={props.busy}
            {...formik.getFieldProps('email')}
            error={!!formik.errors.email}
            helperText={formik.errors.email}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2">
            Mailing address
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Line 1 *"
            disabled={props.busy}
            {...formik.getFieldProps('address.line1')}
            error={!!formik.errors.address?.line1}
            helperText={formik.errors.address?.line1}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Line 2"
            disabled={props.busy}
            {...formik.getFieldProps('address.line2')}
            error={!!formik.errors.address?.line2}
            helperText={formik.errors.address?.line2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City *"
            disabled={props.busy}
            {...formik.getFieldProps('address.city')}
            error={!!formik.errors.address?.city}
            helperText={formik.errors.address?.city}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="State / Province *"
            disabled={props.busy}
            {...formik.getFieldProps('address.state')}
            error={!!formik.errors.address?.state}
            helperText={formik.errors.address?.state}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Postal Code / ZIP Code *"
            disabled={props.busy}
            {...formik.getFieldProps('address.postalCode')}
            error={!!formik.errors.address?.postalCode}
            helperText={formik.errors.address?.postalCode}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Country *"
            disabled={props.busy}
            {...formik.getFieldProps('address.country')}
            error={!!formik.errors.address?.country}
            helperText={formik.errors.address?.country}
          />
        </Grid>
      </Grid>
    </ContextualDrawer>
  );
};
