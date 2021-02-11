import {
  Box,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  IconButton,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';
import ReceiptIcon from '@material-ui/icons/Receipt';
import SendIcon from '@material-ui/icons/Send';
import React, { useMemo, useState } from 'react';
import { useApi } from '../../../../../../api/api.hook';
import { FlowGridCard } from '../../../../../../components/FlowGrid';
import { DocumentMetadata } from '../../../../../../models/document-metadata';
import { downloadBlobFile } from '../../../../../../utils/download.utils';
import { formatDate } from '../../../../../../utils/formatters.utils';

interface Props {
  donationId?: string | null;
  documents: DocumentMetadata[];
  canSendByEmail: boolean;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  noContentContainer: {
    textAlign: 'center',
  },
  receiptIcon: {
    height: '5rem',
    width: 'auto',
  },
}));

export const ReceiptsInformation: React.FC<Props> = (props) => {
  const styles = useStyles(props);
  const api = useApi();

  const [isBusy, setBusy] = useState(false);

  const latestDocument = useMemo(() => {
    if (props.documents.length === 0) {
      return null;
    }

    if (props.documents.length === 1) {
      return props.documents[0];
    }

    const sortedDocuments = [...props.documents].sort(
      (left, right) => (left.created.getTime() - right.created.getTime()) * -1,
    );
    return sortedDocuments[0];
  }, [props.documents]);

  const isEmpty = !latestDocument;
  const subtitle = `${props.documents.length} receipt(s)`;

  const empty = (
    <Box className={styles.noContentContainer}>
      <ReceiptIcon className={styles.receiptIcon} />
      <Typography variant="h6" component="p">
        No receipt has been generated yet
      </Typography>
      <Typography variant="body2">Make sure you provide a mailing address.</Typography>
    </Box>
  );

  const handleDownloadReceipt = () => {
    api(
      async (httpApi) => {
        setBusy(true);

        try {
          const receiptContent = await httpApi.downloadReceipt(props.donationId || '', latestDocument?.id || '');
          downloadBlobFile(receiptContent, latestDocument?.name || 'receipt.pdf');
        } finally {
          setBusy(false);
        }
      },
      'downloading receipt',
      { showLoading: true, showSuccess: true },
    );
  };

  const handleResendReceipt = () => {
    api(
      async (httpApi) => {
        setBusy(true);

        try {
          await httpApi.sendCorrespondence(props.donationId || '', 'thank-you');
        } finally {
          setBusy(false);
        }
      },
      'sending receipt',
      { showLoading: true, showSuccess: true },
    );
  };

  return (
    <FlowGridCard variant="outlined">
      <CardHeader title="Receipt" subheader={subtitle}></CardHeader>
      <CardContent>
        {isEmpty ? (
          empty
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" component="span">
                Receipt number
              </Typography>
              <Typography>{latestDocument?.id}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" component="span">
                Created on
              </Typography>
              <Typography>{latestDocument ? formatDate(latestDocument.created) : '-'}</Typography>
            </Grid>
          </Grid>
        )}
      </CardContent>
      <CardActions>
        {isEmpty ? null : (
          <>
            <IconButton title="Download receipt" disabled={isBusy} onClick={handleDownloadReceipt}>
              <GetAppIcon />
            </IconButton>
            {props.canSendByEmail ? (
              <IconButton title="Send receipt by email" disabled={isBusy} onClick={handleResendReceipt}>
                <SendIcon />
              </IconButton>
            ) : null}
          </>
        )}
      </CardActions>
    </FlowGridCard>
  );
};
