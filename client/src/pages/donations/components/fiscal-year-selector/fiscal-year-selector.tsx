import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select } from '@material-ui/core';
import React, { useState } from 'react';

interface Props {
  open: boolean;
  initialFiscalYear: string;
  availableYears: string[];
  onFiscalYearSelected: (nextFiscalYear: string) => void;
  onClose: () => void;
}

export const FiscalYearSelector: React.FC<Props> = (props) => {
  const [fiscalYear, setFiscalYear] = useState(props.initialFiscalYear);
  const isPristine = fiscalYear === props.initialFiscalYear;

  const handleFiscalYearChanged = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setFiscalYear(event.target.value as string);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    props.onFiscalYearSelected(fiscalYear);
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <form onSubmit={handleFormSubmit}>
        <DialogTitle>Select the fiscal year to view</DialogTitle>
        <DialogContent>
          <Select label="Fiscal year" value={fiscalYear} onChange={handleFiscalYearChanged}>
            {props.availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                Year {year}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose}>Cancel</Button>
          <Button color="primary" type="submit" disabled={isPristine}>
            Select
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
