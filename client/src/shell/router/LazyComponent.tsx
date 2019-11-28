import React, { useMemo, useState } from 'react'
import { Spin, Result } from 'antd'

import css from './LazyComponent.scss'

export interface LazyComponentProps {
  load: () => Promise<React.ComponentType>
}

const delay = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

type LoadingStatus = 'none' | 'loading' | 'error' | 'success'

export const LazyComponent: React.FC<LazyComponentProps> = props => {
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('none')
  const [loadedComponent, setComponent] = useState<
    React.ComponentType | undefined
  >(undefined)

  useMemo(async () => {
    setLoadingStatus('loading')
    setComponent(undefined)

    try {
      const component = await props.load()
      setLoadingStatus('success')
      setComponent(() => component)

      return component
    } catch (err) {
      console.error('Error while importing component', err)
      setLoadingStatus('error')
    }

    return undefined
  }, [props.load, setLoadingStatus, setComponent])

  if (loadingStatus === 'none') {
    return null
  }

  if (loadingStatus === 'loading') {
    return (
      <div className={css.flexWrapper}>
        <div>
          <Spin size='large' wrapperClassName='patate' />
        </div>
      </div>
    )
  }

  if (loadingStatus === 'success' && loadedComponent) {
    return React.createElement(loadedComponent)
  }

  return (
    <div className={css.flexWrapper}>
      <Result
        status='error'
        title='Could not load page'
        subTitle='An error occurred while loading this page. We are sorry'
      />
    </div>
  )
}
