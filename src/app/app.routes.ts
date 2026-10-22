import {
    Routes
} from '@angular/router';

import {
    adminGuard,
    authGuard
} from './core/auth/auth.guard';

export const routes: Routes = [

    // ---------------------------------------------------------
    // Public routes
    // ---------------------------------------------------------

    {
        path: 'login',

        loadComponent: () =>
            import(
                './features/login/login.component'
            ).then(
                module =>
                    module.LoginComponent
            )
    },

    {
        path: 'activate',

        loadComponent: () =>
            import(
                './features/account/activate/activate.component'
            ).then(
                module =>
                    module.ActivateComponent
            )
    },

    {
        path: 'forgot-password',

        loadComponent: () =>
            import(
                './features/account/forgot-password/forgot-password.component'
            ).then(
                module =>
                    module.ForgotPasswordComponent
            )
    },
    {
        path: 'forgot-password/confirmation',

        loadComponent: () =>
            import(
                './features/account/forgot-password/forgot-password-confirmation.component'
            ).then(
                module =>
                    module.ForgotPasswordConfirmationComponent
            )
    },
    {
        path: 'admin/users',

        canActivate: [
            authGuard,
            adminGuard
        ],

        loadComponent: () =>
            import(
                './features/admin/users/manage-users/manage-users.component'
            ).then(
                module =>
                    module.ManageUsersComponent
            )
    },
    {
        path: 'reset-password',

        loadComponent: () =>
            import(
                './features/account/reset-password/reset-password.component'
            ).then(
                module =>
                    module.ResetPasswordComponent
            )
    },

    // ---------------------------------------------------------
    // Authenticated routes
    // ---------------------------------------------------------

    {
        path: 'dashboard',

        canActivate: [
            authGuard
        ],

        loadComponent: () =>
            import(
                './features/dashboard/dashboard.component'
            ).then(
                module =>
                    module.DashboardComponent
            )
    },

    // ---------------------------------------------------------
    // Administrator routes
    // ---------------------------------------------------------

    {
        path: 'admin',

        canActivate: [
            authGuard,
            adminGuard
        ],

        loadComponent: () =>
            import(
                './features/admin/admin.component'
            ).then(
                module =>
                    module.AdminComponent
            )
    },

    {
        path: 'admin/users/create',

        canActivate: [
            authGuard,
            adminGuard
        ],

        loadComponent: () =>
            import(
                './features/admin/users/create-user/create-user.component'
            ).then(
                module =>
                    module.CreateUserComponent
            )
    },

    // ---------------------------------------------------------
    // Forbidden
    // ---------------------------------------------------------

    {
        path: 'forbidden',

        loadComponent: () =>
            import(
                './features/forbidden/forbidden.component'
            ).then(
                module =>
                    module.ForbiddenComponent
            )
    },

    // ---------------------------------------------------------
    // Default
    // ---------------------------------------------------------

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },

    // THIS MUST BE LAST.
    {
        path: '**',
        redirectTo: 'login'
    }

];