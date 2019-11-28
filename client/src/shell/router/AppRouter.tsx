import React, { useCallback } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { LazyComponent } from './LazyComponent'

export const AppRouter: React.FC<{}> = () => {
  const loadDonations = useCallback(async () => {
    const module = await import('../../donations/DonationsPage')
    return module.DonationsPage
  }, [])

  return (
    <Switch>
      <Route path='/donations'>
        <LazyComponent load={loadDonations}></LazyComponent>
      </Route>

      <Route path='/templates'>
        <h1>Template management</h1>
      </Route>

      <Route path='/'>
        <Redirect to='/donations' />
      </Route>
    </Switch>
  )
}
