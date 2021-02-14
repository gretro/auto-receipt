import {
  Box,
  Button,
  debounce,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Menu,
  MenuItem,
  TextField,
  Theme,
} from '@material-ui/core';
import ClearAllIcon from '@material-ui/icons/ClearAll';
import FilterListIcon from '@material-ui/icons/FilterList';
import React, { ChangeEvent, useRef, useState } from 'react';

export interface QuickFilter {
  id: string;
  label: string;
}

interface Props {
  quickFilters: QuickFilter[];
  onTextFilterChanged: (textFilter: string) => void;
  onQuickFilterChanged: (quickFilter: string | null) => void;
}

const useStyles = makeStyles<Theme, Props>((theme) => ({
  box: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: `${theme.spacing(2)}px`,
  },
}));

export const FilterBar: React.FC<Props> = (props) => {
  const [filterMenuActive, setFilterMenuActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [textFilter, setTextFilter] = useState('');
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);

  const styles = useStyles(props);

  const dispatchTextFilterChangedRef = useRef(
    debounce((nextValue: string) => {
      props.onTextFilterChanged(nextValue);
    }, 250),
  );

  const handleTextFilterChanged = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value || '';
    setTextFilter(value);

    dispatchTextFilterChangedRef.current(value);
  };

  const handleFilterMenuActiveToggle = () => {
    setFilterMenuActive((current) => !current);
  };

  const getFilterChangedHandler = (filterId: string | null) => () => {
    setActiveFilter(filterId);
    props.onQuickFilterChanged(filterId);

    handleFilterMenuActiveToggle();
  };

  return (
    <Box className={styles.box}>
      <TextField
        label="Search by name or email"
        variant="outlined"
        value={textFilter}
        onChange={handleTextFilterChanged}
      />
      <Button
        ref={menuAnchorRef}
        aria-controls="quick-filters-menu"
        aria-haspopup="true"
        title="Quick filters"
        variant={activeFilter ? 'contained' : 'outlined'}
        onClick={handleFilterMenuActiveToggle}
      >
        <FilterListIcon />
      </Button>
      <Menu
        id="quick-filters-menu"
        keepMounted
        anchorEl={menuAnchorRef.current}
        open={filterMenuActive}
        onClose={handleFilterMenuActiveToggle}
      >
        {props.quickFilters.map((quickFilter) => (
          <MenuItem
            key={quickFilter.id}
            selected={activeFilter === quickFilter.id}
            onClick={getFilterChangedHandler(quickFilter.id)}
          >
            <ListItemText>{quickFilter.label}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem disabled={!activeFilter} onClick={getFilterChangedHandler(null)}>
          <ListItemIcon>
            <ClearAllIcon />
          </ListItemIcon>
          <ListItemText>Clear filter</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
