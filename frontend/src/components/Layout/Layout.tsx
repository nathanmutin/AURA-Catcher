import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';
import './Layout.css';

const Layout: React.FC = () => {
    return (
        <div className="layout">
            <Navbar />
            {/* Content Area */}
            <main className="layout-main">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
