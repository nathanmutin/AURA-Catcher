import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPanneaux } from '../../api/client';
import './FakeReCaptcha.css';

interface CaptchaImage {
    id: string;
    src: string;
    isAura: boolean;
}

// Import automatically all images in the assets/recaptcha folder
const piegeModules = import.meta.glob('../../assets/recaptcha/*.{jpg,jpeg,png,webp,avif}', { eager: true });

const ALL_PIEGE_IMAGES: CaptchaImage[] = Object.values(piegeModules).map((mod: any, index) => ({
    id: `piege-${index}`,
    src: mod.default,
    isAura: false
}));

const shuffleArray = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
};

const FakeReCaptcha: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [images, setImages] = useState<CaptchaImage[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    const [shouldCheck] = useState(() => {
        const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
        if (isBot) return false; // Do not show for SEO indexers

        const lastVisit = localStorage.getItem('lastVisitTimestamp');
        const now = Date.now();
        // 7 jours en millisecondes
        const threshold = 7 * 24 * 60 * 60 * 1000;

        return !lastVisit || now - parseInt(lastVisit || '0') > threshold;
    });

    const { data: panneaux, isSuccess } = useQuery({
        queryKey: ['panneaux'],
        queryFn: fetchPanneaux,
        enabled: shouldCheck,
    });

    useEffect(() => {
        if (isSuccess && panneaux && images.length === 0) {
            const communePanels = panneaux.filter((p: any) => p.typeId === 2 && p.imageUrl);

            if (communePanels.length > 0) {
                // If we don't have enough panels, repeat them to reach 6
                let availablePanels = [...communePanels];
                while (availablePanels.length < 6) {
                    availablePanels = [...availablePanels, ...communePanels];
                }

                // Pick exactly 6
                const shuffledPanels = shuffleArray(availablePanels).slice(0, 6);
                const auraImages: CaptchaImage[] = shuffledPanels.map((p: any, index: number) => ({
                    id: `aura-${p.id}-${index}`,
                    src: p.imageUrl,
                    isAura: true
                }));

                // We pick exactly 3 random pièges
                const selectedPieges = shuffleArray([...ALL_PIEGE_IMAGES]).slice(0, 3);

                setImages(shuffleArray([...auraImages, ...selectedPieges]));
                setIsVisible(true);
            }
        }
    }, [isSuccess, panneaux, images.length]);

    if (!isVisible) return null;

    const toggleSelect = (id: string) => {
        setErrorMsg('');
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selId => selId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleVerify = () => {
        const selectedImages = images.filter(img => selectedIds.includes(img.id));
        const hasPiege = selectedImages.some(img => !img.isAura);
        const missedAura = images.some(img => img.isAura && !selectedIds.includes(img.id));

        if (hasPiege) {
            setErrorMsg("Erreur : Vous avez sélectionné un panneau d'une autre région. Êtes-vous un espion ?");
        } else if (missedAura) {
            setErrorMsg("Erreur : Il manque des panneaux de la Région. Regardez mieux !");
        } else {
            // Success
            setIsVisible(false);
            localStorage.setItem('lastVisitTimestamp', Date.now().toString());
        }
    };

    return (
        <div className="recaptcha-overlay">
            <div className="recaptcha-modal">
                <div className="recaptcha-header">
                    <p className="recaptcha-title">Sélectionnez toutes les images avec</p>
                    <p className="recaptcha-subtitle">des panneaux de la Région</p>
                </div>

                <div className="recaptcha-grid">
                    {images.map(img => (
                        <div
                            key={img.id}
                            className={`recaptcha-cell ${selectedIds.includes(img.id) ? 'selected' : ''}`}
                            onClick={() => toggleSelect(img.id)}
                        >
                            <img src={img.src} alt="Captcha part" />
                            {selectedIds.includes(img.id) && (
                                <div className="recaptcha-checkmark">
                                    <svg viewBox="0 0 24 24" fill="white">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {errorMsg && <div className="recaptcha-error">{errorMsg}</div>}

                <div className="recaptcha-footer">
                    <button className="recaptcha-verify-btn" onClick={handleVerify}>
                        Valider
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FakeReCaptcha;
