import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  InputAdornment,
  makeStyles,
  MenuItem,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useFormik } from 'formik';
import React from 'react';
import * as Yup from 'yup';
import { CreateDonationDTO } from '../../../../api/donation-create.dto';
import { ContextualDrawer } from '../../../../components/ContextualDrawer';
import { PageHeader } from '../../../../components/page-header';
import { Address } from '../../../../models/address';
import { Donor } from '../../../../models/donor';
import { PaymentSource } from '../../../../models/payment';
import { getMinMsg, requiredMsg } from '../../../../strings/validation.common';

interface Props {
  operationId: number;
  busy: boolean;
  onSave: (newDonation: CreateDonationDTO, createMore: boolean) => void;
  onCancel: () => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  actions: {
    display: 'flex',
    flexDirection: 'row-reverse',
    gap: `${theme.spacing(1)}px`,
    paddingTop: theme.spacing(2),
  },
}));

interface FormValues {
  emailReceipt: boolean;
  source: PaymentSource;
  currency: string;
  amount: string;
  receiptAmount: string;
  paymentDate: string;
  donor: Omit<Donor, 'address'> & Address;
  reasonForDonation: string;
  createMore: boolean;
}

const paymentSources = [
  {
    id: 'cheque',
    label: 'Cheque',
  },
  {
    id: 'directDeposit',
    label: 'Direct Deposit',
  },
  {
    id: 'stocks',
    label: 'Stocks',
  },
  {
    id: 'unknown',
    label: 'Other',
  },
];

const CURRENCY_REGEX = /^(\d)+(\.\d{2})?$/;
function currencyTransform(value: any, originalValue: any): number {
  return CURRENCY_REGEX.test(originalValue) ? value : Number.NaN;
}

const formValuesSchema = Yup.object({
  emailReceipt: Yup.boolean().required(requiredMsg),
  source: Yup.string()
    .oneOf(paymentSources.map((src) => src.id))
    .required(requiredMsg),
  currency: Yup.string().required(requiredMsg),
  amount: Yup.number()
    .transform(currencyTransform)
    .typeError('Must be a valid amount')
    .moreThan(0, 'Must be greater than 0')
    .required(requiredMsg),
  receiptAmount: Yup.number()
    .transform(currencyTransform)
    .typeError('Must be a valid amount')
    .moreThan(0, 'Must be greater than 0')
    .max(Yup.ref('amount') as any, 'Cannot be more than the donation amount')
    .optional(),
  paymentDate: Yup.date().required(requiredMsg),
  createMore: Yup.boolean().required(requiredMsg),
  donor: Yup.object({
    firstName: Yup.string().min(2, getMinMsg(2)).optional(),
    lastName: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
    email: Yup.string().email().optional(),
    line1: Yup.string().min(3, getMinMsg(3)).required(requiredMsg),
    line2: Yup.string().optional(),
    city: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
    state: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
    country: Yup.string().min(2, getMinMsg(2)).required(requiredMsg),
    postalCode: Yup.string().required(requiredMsg),
  }).required(requiredMsg),
  reasonForDonation: Yup.string().optional(),
});

export const DonationCreateDrawer: React.FC<Props> = (props) => {
  const styles = useStyles(props);

  const formik = useFormik<FormValues>({
    initialValues: {
      source: 'cheque',
      emailReceipt: true,
      currency: 'CAD',
      amount: '',
      receiptAmount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      reasonForDonation: '',
      donor: {
        firstName: '',
        lastName: '',
        email: '',
        line1: '',
        line2: '',
        city: '',
        country: 'Canada',
        postalCode: '',
        state: '',
      },
      createMore: false,
    },
    onSubmit: (values) => {
      if (props.busy) {
        return;
      }

      const donationAmount = parseFloat(values.amount);
      const toCreate: CreateDonationDTO = {
        donationType: 'one-time',
        emailReceipt: values.emailReceipt,
        source: values.source || 'unknown',
        currency: values.currency,
        amount: donationAmount,
        receiptAmount: values.receiptAmount ? parseFloat(values.receiptAmount) : donationAmount,
        paymentDate: new Date(values.paymentDate),
        reason: values.reasonForDonation || undefined,
        donor: {
          firstName: values.donor.firstName || null,
          lastName: values.donor.lastName,
          email: values.donor.email || null,
          address: {
            line1: values.donor.line1,
            line2: values.donor.line2 || null,
            city: values.donor.city,
            state: values.donor.state,
            postalCode: values.donor.postalCode,
            country: values.donor.country,
          },
        },
      };

      props.onSave(toCreate, values.createMore);
    },
    validationSchema: formValuesSchema,
  });

  React.useEffect(() => {
    formik.resetForm({ values: { ...formik.initialValues, createMore: formik.values.createMore } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.operationId]);

  const handleCancel = () => {
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
    props.onCancel();
  };

  const headerEl = (
    <PageHeader
      pageTitle="New donation"
      subTitle={`Create a donation received by cheque, stocks or direct deposit`}
      actionButtonIcon={<CloseIcon />}
      actionButtonLabel="Close Drawer"
      onActionButtonClicked={handleCancel}
      smallTitle
    />
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
      <Button onClick={handleCancel} disabled={props.busy}>
        Cancel
      </Button>
    </Box>
  );

  return (
    <ContextualDrawer
      header={headerEl}
      footer={footerEl}
      open
      surfaceComponent="form"
      SurfaceProps={{
        onSubmit: formik.handleSubmit as any,
      }}
      onDrawerClose={handleCancel}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2">
            Donation information
          </Typography>
        </Grid>

        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            label="Currency *"
            disabled
            select
            {...formik.getFieldProps('currency')}
            error={!!formik.errors.currency}
            helperText={formik.errors.currency}
          >
            <MenuItem value="CAD">CAD ($)</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Amount donated *"
            autoFocus
            disabled={props.busy}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            {...formik.getFieldProps('amount')}
            error={!!formik.errors.amount}
            helperText={formik.errors.amount}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Receipt amount"
            disabled={props.busy}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            {...formik.getFieldProps('receiptAmount')}
            error={!!formik.errors.receiptAmount}
            helperText={formik.errors.receiptAmount || 'Leave empty for same amount'}
            placeholder={formik.errors.amount ? '' : formik.values.amount}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Type *"
            select
            {...formik.getFieldProps('source')}
            error={!!formik.errors.source}
            helperText={formik.errors.source}
          >
            {paymentSources.map((paySrc) => (
              <MenuItem key={paySrc.id} value={paySrc.id}>
                {paySrc.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Reason for donation"
            disabled={props.busy}
            {...formik.getFieldProps('reasonForDonation')}
            error={!!formik.errors.reasonForDonation}
            helperText={formik.errors.reasonForDonation}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Date *"
            type="date"
            disabled={props.busy}
            InputLabelProps={{
              shrink: true,
            }}
            {...formik.getFieldProps('paymentDate')}
            error={!!formik.errors.paymentDate}
            helperText={formik.errors.paymentDate}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2">
            Donor information
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First name"
            disabled={props.busy}
            {...formik.getFieldProps('donor.firstName')}
            error={!!formik.errors.donor?.firstName}
            helperText={formik.errors.donor?.firstName}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last name / Organization name *"
            disabled={props.busy}
            {...formik.getFieldProps('donor.lastName')}
            error={!!formik.errors.donor?.lastName}
            helperText={formik.errors.donor?.lastName}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            disabled={props.busy}
            {...formik.getFieldProps('donor.email')}
            error={!!formik.errors.donor?.email}
            helperText={formik.errors.donor?.email}
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
            {...formik.getFieldProps('donor.line1')}
            error={!!formik.errors.donor?.line1}
            helperText={formik.errors.donor?.line1}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Line 2"
            disabled={props.busy}
            {...formik.getFieldProps('donor.line2')}
            error={!!formik.errors.donor?.line2}
            helperText={formik.errors.donor?.line2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City *"
            disabled={props.busy}
            {...formik.getFieldProps('donor.city')}
            error={!!formik.errors.donor?.city}
            helperText={formik.errors.donor?.city}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="State / Province *"
            disabled={props.busy}
            {...formik.getFieldProps('donor.state')}
            error={!!formik.errors.donor?.state}
            helperText={formik.errors.donor?.state}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Postal Code / ZIP Code *"
            disabled={props.busy}
            {...formik.getFieldProps('donor.postalCode')}
            error={!!formik.errors.donor?.postalCode}
            helperText={formik.errors.donor?.postalCode}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Country *"
            disabled={props.busy}
            {...formik.getFieldProps('donor.country')}
            error={!!formik.errors.donor?.country}
            helperText={formik.errors.donor?.country}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2">
            Options
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            label="Allow receipts to be sent by email (if one is provided)"
            control={
              <Checkbox
                color="primary"
                checked={formik.values.emailReceipt}
                {...formik.getFieldProps('emailReceipt')}
              />
            }
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            label="Create another donation"
            control={
              <Checkbox color="primary" checked={formik.values.createMore} {...formik.getFieldProps('createMore')} />
            }
          />
        </Grid>
      </Grid>
    </ContextualDrawer>
  );
};
