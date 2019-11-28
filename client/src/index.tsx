import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './shell/App'
import './styles/index.scss'

function getReactRoot() {
  return document.querySelector('[react-root]')
}

function render() {
  const rootElement = getReactRoot()

  ReactDOM.render(<App />, rootElement)
}

render()
