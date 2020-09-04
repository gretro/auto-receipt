import { Link } from '@material-ui/core';
import React from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';

type AppLinkProps = LinkProps & React.RefAttributes<HTMLAnchorElement>;

export const AppLink: React.FC<AppLinkProps> = (props) => {
  return (
    <Link component={RouterLink} {...(props as any)}>
      {props.children}
    </Link>
  );
};
