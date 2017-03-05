import 'localstorage-polyfill';
import m from 'mithril';

import Dashboard from 'containers/dashboard/dashboard';
import Login from 'containers/login/login';
import MainLayout from 'layouts/MainLayout/MainLayout';


document.addEventListener('DOMContentLoaded', () => {
    var root = document.getElementById('app');
    localStorage.setItem('user',false);
    const WrapMainLayout = (children) => {
        return {
            view() {
                return (
                    <MainLayout>{children}</MainLayout>
                );
            }
        }
    };

    m.route.mode = 'hash';
    m.route(root, '/', {
        '/dashboard': Login,
        '/': WrapMainLayout(Dashboard)
    });
});
