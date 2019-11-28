import React, { useState } from 'react'
import { Layout, Menu, Icon, Dropdown, Button } from 'antd'
import { Router, Link, BrowserRouter } from 'react-router-dom'

import * as css from './Shell.scss'
import { AppRouter } from './router/AppRouter'

export const Shell: React.FC<{}> = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <BrowserRouter>
      <Layout className={css.layout}>
        <Layout.Sider
          breakpoint='md'
          collapsedWidth='0'
          collapsed={collapsed}
          onCollapse={setCollapsed}
        >
          <Menu theme='dark' defaultSelectedKeys={['1']} mode='inline'>
            <Menu.Item key='1'>
              <Link to='/donations'>
                <Icon type='database' />
                <span>Donations</span>
              </Link>
            </Menu.Item>
            <Menu.Item>
              <Link to='/templates'>
                <Icon type='file' />
                <span>Templates</span>
              </Link>
            </Menu.Item>
          </Menu>
        </Layout.Sider>
        <Layout>
          <Layout.Header className={css.header}>
            <div className={css.headerContainer}>
              <Button disabled>
                <Icon type='global' />
                <span>FR</span>
              </Button>

              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item>Log out</Menu.Item>
                  </Menu>
                }
              >
                <Button>
                  <Icon type='user' />
                  <span>Gabriel Lemire</span>
                </Button>
              </Dropdown>
            </div>
          </Layout.Header>
          <Layout.Content className={css.content}>
            <AppRouter />
          </Layout.Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  )
}
