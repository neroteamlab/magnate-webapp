import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

interface ClickEffect {
    x: number;
    y: number;
    id: number;
}

const FishCatchingGame: React.FC = () => {
    const {
        showFishCatching,
        fishPosition,
        clickFish,
    } = useGameStore();

    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [clickEffect, setClickEffect] = useState<ClickEffect | null>(null);

    useEffect(() => {
        if (showFishCatching) {
            setIsVisible(true);
        } else {
            const t = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(t);
        }
    }, [showFishCatching]);

    if (!showFishCatching && !isVisible) return null;

    const handleFishClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        clickFish();

        const rect = e.currentTarget.getBoundingClientRect();
        setClickEffect({
            x: rect.left + rect.width / 2,
            y: rect.top,
            id: Date.now(),
        });
        
        setTimeout(() => setClickEffect(null), 600);
    };

    return (
        <div className={`fish-catching-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="fish-catching-backdrop" />

            {/* Силуэт рыбы */}
            <div
                className="fish-silhouette"
                style={{
                    left: `${fishPosition.x}%`,
                    top: `${fishPosition.y}%`,
                }}
                onClick={handleFishClick}
            >
                <svg className="fish-svg" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                    <ellipse className="fish-body" cx="100" cy="50" rx="80" ry="35" />
                    <polygon className="fish-body" points="25,50 0,20 0,80" />
                    <polygon className="fish-body" points="80,18 110,0 130,18" />
                    <polygon className="fish-body" points="80,82 110,100 130,82" />
                    <polygon className="fish-body" points="90,65 75,85 105,75" />
                    <ellipse className="fish-body" cx="178" cy="52" rx="15" ry="10" />
                    <circle className="fish-eye-outer" cx="155" cy="40" r="6" />
                    <circle className="fish-eye-inner" cx="155" cy="40" r="3" />
                </svg>
            </div>

            {/* Эффект +1 */}
            {clickEffect && (
                <div
                    className="click-effect"
                    style={{ 
                        left: `${clickEffect.x}px`,
                        top: `${clickEffect.y}px` 
                    }}
                >
                    +1
                </div>
            )}

            <div className="catch-hint">Кликай по рыбе!</div>
        </div>
    );
}

export default FishCatchingGame;