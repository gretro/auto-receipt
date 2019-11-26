import ReactDOM from 'react-dom'
import { AppShell } from './shell/AppShell'
import './styles/index.scss'

function getReactRoot() {
  return document.querySelector('[react-root]')
}

function render() {
  const rootElement = getReactRoot()

  ReactDOM.render(AppShell(), rootElement)
}

render()
