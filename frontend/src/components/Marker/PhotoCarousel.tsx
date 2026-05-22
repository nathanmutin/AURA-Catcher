import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PhotoCarousel.css';

interface PhotoCarouselProps {
    photoUrl: (imageId: number) => string;
    imageIds: number[];
    alt: string;
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photoUrl, imageIds, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    useEffect(() => {
        setCurrentIndex(0);
    }, [imageIds]);

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
    }, [currentIndex, imageIds.length]);

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % imageIds.length);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + imageIds.length) % imageIds.length);
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0];
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null || touchStartY.current === null) {
            return;
        }

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX.current;
        const deltaY = touch.clientY - touchStartY.current;

        touchStartX.current = null;
        touchStartY.current = null;

        const horizontalThreshold = 40;
        const verticalTolerance = 30;

        if (Math.abs(deltaX) < horizontalThreshold || Math.abs(deltaY) > verticalTolerance) {
            return;
        }

        if (deltaX < 0) {
            goToNext();
        } else {
            goToPrevious();
        }
    };

    if (imageIds.length === 0) {
        return (
            <div className="carousel-empty">
                <p>Aucune photo disponible</p>
            </div>
        );
    }

    return (
        <div className="carousel-wrapper">
            <div
                className="carousel-container"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={photoUrl(imageIds[currentIndex])}
                    alt={`${alt} - ${currentIndex + 1}/${imageIds.length}`}
                    className="carousel-img"
                    loading="lazy"
                />

                {imageIds.length > 1 && (
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
                            {Array.from({ length: imageIds.length }).map((_, i) => (
                                <button
                                    key={i}
                                    className={`carousel-dot ${i === currentIndex ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(i)}
                                    aria-label={`Photo ${i + 1}`}
                                    aria-current={i === currentIndex ? 'true' : 'false'}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
