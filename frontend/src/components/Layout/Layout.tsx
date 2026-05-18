import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import FakeReCaptcha from '../FakeReCaptcha/FakeReCaptcha';
import './Layout.css';

const Layout: React.FC = () => {
    return (
        <div className="layout">
            <FakeReCaptcha />
            <Navbar />
            {/* Content Area */}
            <main className="layout-main">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
