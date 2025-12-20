import React, { useState, useMemo, useEffect } from 'react';
import { Download, Link, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { calculatePanelLayout } from '../utils/panelLayout';
import { renderPanelToReact, renderPanelToString } from '../utils/panelRenderers';
import './GeneratorPage.css';

const GeneratorPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    // Initialize text from URL or default
    const [text, setText] = useState(searchParams.get('text') || 'La Région soutient la raclette');
    const [copied, setCopied] = useState(false);

    // Sync URL with text (debounced effect could be added, but simple update is fine for now)
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (text) {
            params.set('text', text);
        } else {
            params.delete('text');
        }
        setSearchParams(params, { replace: true });
    }, [text, setSearchParams]);

    // Calculate layout
    const layout = useMemo(() => calculatePanelLayout(text), [text]);

    const handleDownloadSvg = () => {
        const svgString = renderPanelToString(layout);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'panneau-aura.svg';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPng = () => {
        const svgString = renderPanelToString(layout);
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Use high resolution for PNG (2x scale)
            const scale = 2;
            canvas.width = layout.width * scale;
            canvas.height = layout.height * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Scale the context so drawing at (0,0) fills the larger canvas
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'panneau-aura.png';
                link.href = pngUrl;
                link.click();
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="generator-page">
            <div className="preview-panel">
                <div className="panneau-wrapper">
                    {/* Render the React SVG with in-place editing */}
                    {renderPanelToReact(layout, false, {
                        value: layout.customText.lines.map(l => l.text).join('\n'), // Use lines to force consistent wrap
                        onChange: (val) => setText(val)
                    })}
                </div>

                <div className="button-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginTop: '2rem', width: '100%', maxWidth: '300px' }}>
                    <button className="btn-primary" onClick={handleDownloadPng}>
                        <Download size={20} style={{ marginRight: '0.5rem' }} />
                        PNG
                    </button>
                    <button className="btn-secondary" onClick={handleDownloadSvg}>
                        <Download size={20} style={{ marginRight: '0.5rem' }} />
                        SVG
                    </button>
                    <button className="btn-secondary" onClick={handleCopyLink} title="Copier le lien">
                        {copied ? <Check size={20} /> : <Link size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneratorPage;
