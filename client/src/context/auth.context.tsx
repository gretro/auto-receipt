import firebase from 'firebase/app';
import React, { createContext, Dispatch, Reducer, useReducer } from 'react';

export interface AuthenticatedUser {
  fullName: string;
  email: string;
  firebaseUser: firebase.User;
}

export const authContext = createContext<{ state: AuthenticatedUser | null; dispatch: Dispatch<AuthAction> } | null>(
  null,
);

export interface AuthenticatedAction {
  type: 'authenticated';
  payload: AuthenticatedUser;
}

export interface LoggedOutAction {
  type: 'logged-out';
}

export type AuthAction = AuthenticatedAction | LoggedOutAction;

export const AuthProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer<Reducer<AuthenticatedUser | null, AuthAction>>((_, action) => {
    switch (action.type) {
      case 'authenticated': {
        return action.payload;
      }

      case 'logged-out':
        return null;

      default:
        throw new Error('Unknown action');
    }
  }, null);

  return <authContext.Provider value={{ state, dispatch }}>{children}</authContext.Provider>;
};
