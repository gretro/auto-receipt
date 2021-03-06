import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { DonationsRouting } from '../../pages/donations/donations-routing';
import { NotFoundPage } from '../../pages/not-found/not-found.page';

export const AppRouting: React.FC = () => {
  return (
    <Switch>
      <Route path="/donations">
        <DonationsRouting />
      </Route>
      <Route path="/" strict>
        <Redirect to="/donations" />
      </Route>
      <Route path="*">
        <NotFoundPage />
      </Route>
    </Switch>
  );
};
