import { Box, CssBaseline } from '@material-ui/core';
import { createMuiTheme, makeStyles, ThemeProvider } from '@material-ui/core/styles';
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { HomePage } from './home/home.page';
import { NotFoundPage } from './not-found/not-found.page';
import { Page1 } from './page1/page1.page';
import { Page2 } from './page2/pag2.page';
import { AppSidebar } from './shell/app-side-bar/app-side-bar.component';

const theme = createMuiTheme();

const useStyles = makeStyles(() => ({
  appContainer: {
    height: '100vh',
    width: '100vw',
    display: 'grid',
  },
}));

export const App: React.FC = () => {
  const styles = useStyles();

  return (
    <Box className={styles.appContainer}>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <Router>
          <nav>
            <AppSidebar />
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
      </ThemeProvider>
    </Box>
  );
};
