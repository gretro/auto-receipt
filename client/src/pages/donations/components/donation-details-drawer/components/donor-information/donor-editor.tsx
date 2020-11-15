import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  makeStyles,
  Paper,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useFormik } from 'formik';
import React from 'react';
import { PageHeader } from '../../../../../../components/page-header';
import { Donor } from '../../../../../../models/donor';

interface Props {
  open: boolean;
  donationId: string | null | undefined;
  donor: Donor | null | undefined;
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

interface DonorEdit {
  firstName?: string;
  lastName?: string;
  email?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  generateReceipt: boolean;
}

export const DonorEditor: React.FC<Props> = (props) => {
  const styles = useStyles(props);

  const formik = useFormik<DonorEdit>({
    initialValues: {
      firstName: props.donor?.firstName || '',
      lastName: props.donor?.lastName || '',
      email: props.donor?.email || '',
      line1: props.donor?.address?.line1 || '',
      line2: props.donor?.address?.line2 || '',
      city: props.donor?.address?.city || '',
      state: props.donor?.address?.state || '',
      postalCode: props.donor?.address?.postalCode || '',
      country: props.donor?.address?.country || '',
      generateReceipt: !props.donor?.address,
    },
    onSubmit: (values) => {
      console.log('Submitted!', values);
    },
    enableReinitialize: true,
  });

  const handleFormClose = () => {
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
          <TextField label="First name" autoFocus required {...formik.getFieldProps('firstName')} />
          <TextField label="Last name" required {...formik.getFieldProps('lastName')} />
          <TextField label="Email" type="email" {...formik.getFieldProps('email')} />

          <Typography variant="subtitle1" className={styles.subTitle}>
            Mailing address
          </Typography>
          <TextField label="Line 1" {...formik.getFieldProps('line1')} />
          <TextField label="Line 2" {...formik.getFieldProps('line2')} />
          <TextField label="City" {...formik.getFieldProps('city')} />
          <TextField label="State" {...formik.getFieldProps('state')} />
          <TextField label="Postal Code / Zip code" {...formik.getFieldProps('postalCode')} />
          <TextField label="Country" {...formik.getFieldProps('country')} />

          <FormControlLabel
            control={
              <Checkbox
                name="generateReceipt"
                checked={formik.values.generateReceipt}
                onChange={formik.handleChange}
                color="primary"
              />
            }
            label="Generate a new receipt"
          />
        </Box>
        <Divider className={styles.divider} />
        <Box className={styles.actions}>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
          <Button onClick={handleFormClose}>Cancel</Button>
        </Box>
      </Paper>
    </Drawer>
  );
};
