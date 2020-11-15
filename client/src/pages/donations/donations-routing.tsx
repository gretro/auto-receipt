import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { DonationsPage } from './donations.page';

export const DonationsRouting: React.FC = () => {
  const currentYear = new Date().getFullYear().toString();
  const { path, url } = useRouteMatch();

  return (
    <Switch>
      <Route path={path} exact>
        <Redirect to={`${url}/${currentYear}`} />
      </Route>
      <Route path={`${path}/:fiscalYear`}>
        <DonationsPage />
      </Route>
    </Switch>
  );
};
