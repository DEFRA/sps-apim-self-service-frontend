import {
  ApplicationConfig
} from '@angular/core';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import {
  provideRouter
} from '@angular/router';

import {
  routes
} from './app.routes';

import {
  credentialsInterceptor
} from './core/http/credentials.interceptor';

import {
  authenticationResponseInterceptor
} from './core/http/authentication-response.interceptor';

export const appConfig:
  ApplicationConfig = {

  providers: [

    provideRouter(
      routes
    ),

    provideHttpClient(

      withInterceptors([

        // Adds cookies and CSRF header.
        credentialsInterceptor,

        // Handles rejected/expired authentication sessions.
        authenticationResponseInterceptor

      ])

    )

  ]

};