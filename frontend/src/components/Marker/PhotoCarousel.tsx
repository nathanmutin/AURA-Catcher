import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PhotoCarousel.css';

interface PhotoCarouselProps {
    photoUrl: (index: number) => string;
    imageCount: number;
    alt: string;
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photoUrl, imageCount, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, imageCount]);

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % imageCount);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + imageCount) % imageCount);
    };

    if (imageCount === 0) {
        return (
            <div className="carousel-empty">
                <p>Aucune photo disponible</p>
            </div>
        );
    }

    return (
        <div className="carousel-wrapper">
            <div className="carousel-container">
                <img
                    src={photoUrl(currentIndex)}
                    alt={`${alt} - ${currentIndex + 1}/${imageCount}`}
                    className="carousel-img"
                    loading="lazy"
                />

                {imageCount > 1 && (
                    <>
                        <button
                            className="carousel-nav carousel-nav-prev"
                            onClick={goToPrevious}
                            title="Photo précédente"
                            aria-label="Photo précédente"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="carousel-nav carousel-nav-next"
                            onClick={goToNext}
                            title="Photo suivante"
                            aria-label="Photo suivante"
                        >
                            <ChevronRight size={20} />
                        </button>

                        <div className="carousel-indicators">
                            {Array.from({ length: imageCount }).map((_, i) => (
                                <button
                                    key={i}
                                    className={`carousel-dot ${i === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(i)}
                                    aria-label={`Photo ${i + 1}`}
                                    aria-current={i === currentIndex ? 'true' : 'false'}
                                />
                            ))}
                        </div>

                        <div className="carousel-counter">
                            {currentIndex + 1} / {imageCount}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
