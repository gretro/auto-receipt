import React from 'react'
import { ConfigProvider } from 'antd'
import en from 'antd/es/locale/en_US'
import moment from 'moment'

import { Shell } from './Shell'

moment.locale('en-US')

export const App: React.FC<{}> = () => {
  return (
    <ConfigProvider locale={en}>
      <Shell></Shell>
    </ConfigProvider>
  )
}
