import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { Page2 } from './page2/pag2.page';
import { Page1 } from './page1/page1.page';
import { HomePage } from './home/home.page';
import { NotFoundPage } from './not-found/not-found.page';

export const App: React.FC = () => {
  return (
    <>
      <Router>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/page1">Page 1</Link>
            </li>
            <li>
              <Link to="/page2">Page 2</Link>
            </li>
            <li>
              <Link to="/patate">Not Found</Link>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route exact path="/">
            <HomePage />
          </Route>

          <Route path="/page1">
            <Page1 />
          </Route>

          <Route path="/page2">
            <Page2 />
          </Route>

          <Route path="*">
            <NotFoundPage />
          </Route>
        </Switch>
      </Router>
    </>
  );
};

export default App;
