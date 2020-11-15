import { Box, Card, CardProps, makeStyles, Theme } from '@material-ui/core';
import React from 'react';

interface Props {
  columns: number;
  spacing: number;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  flowGrid: (props) => ({
    display: 'grid',
    gridTemplateColumns: new Array(props.columns).fill('1fr').join(' '),
    gridAutoRows: 'max-content',
    gap: `${props.spacing}px`,
    listStyle: 'none',
    padding: 0,
    margin: 0,
  }),
}));

export const FlowGrid: React.FC<Props> = (props) => {
  const styles = useStyles(props);

  return (
    <Box component="ul" className={styles.flowGrid}>
      {props.children}
    </Box>
  );
};

export const FlowGridItem: React.FC = ({ children }) => {
  return <Box component="li">{children}</Box>;
};

const useCardStyles = makeStyles<Theme, CardProps>((theme) => ({
  card: {
    display: 'grid',
    height: '100%',
    gridTemplateRows: 'auto 1fr auto',
  },
}));

export const FlowGridCard: React.FC<CardProps> = (props) => {
  const styles = useCardStyles(props);

  return (
    <Card classes={{ root: styles.card }} {...props}>
      {props.children}
    </Card>
  );
};
