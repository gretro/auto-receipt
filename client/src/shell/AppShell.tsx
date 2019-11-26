import React from 'react'
import cx from 'classnames/bind'
import * as appStyles from './AppShell.scss'

const classnames = cx.bind(appStyles)

export const AppShell = () => {
  return (
    <div className={classnames('shellGrid', 'full-height')}>
      <nav className={appStyles.navBar}>
        <div className='top'>
          <button>Receipt</button>
          <button>Templates</button>
        </div>
        <div className='bottom'>
          <button>Logged in user</button>
        </div>
      </nav>
      <main className={appStyles.mainContent}>
        <h1>Main area</h1>
      </main>
    </div>
  )
}
