import React from 'react';
import { ManifestoContent } from './ManifestoContent';
import './ManifestoPage.css';

const ManifestoPage: React.FC = () => {
    return (
        <div className="manifesto-page">
            <div className="manifesto-container">
                <ManifestoContent />
            </div>
        </div>
    );
};

export default ManifestoPage;
