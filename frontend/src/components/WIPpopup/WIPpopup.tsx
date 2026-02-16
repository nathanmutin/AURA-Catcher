import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculatePanelLayout } from '@aura-catcher/shared/generator/panelLayout';
import { renderPanelToReact } from '@aura-catcher/shared/generator/panelRenderers';
import './WIPpopup.css';

const WIPpopup: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check session storage to see if already dismissed
        const dismissed = sessionStorage.getItem('wip_popup_dismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('wip_popup_dismissed', 'true');
    };

    if (!isVisible) return null;

    const panelLayout = calculatePanelLayout("La Région soutient ce site web", 200); // Scale 200 for a smaller size

    return (
        <div className="wip-popup-overlay">
            <div className="wip-popup-content">
                <button className="close-icon" onClick={handleClose} aria-label="Close">
                    <X size={24} />
                </button>

                <h2 className="wip-title">🚧 Site en construction</h2>
                <p className="wip-message">
                    Ce site est actuellement en construction mais reste utilisable. Vous pouvez participer au projet sur GitHub.
                </p>

                <a
                    href="https://github.com/nathanmutin/AURA-Catcher"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                >
                    View on GitHub
                </a>

                <div className="region-panel-container">
                    {renderPanelToReact(panelLayout, false)}
                </div>
            </div>
        </div>
    );
};

export default WIPpopup;
