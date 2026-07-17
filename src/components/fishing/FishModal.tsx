import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

interface FishTemplate<TWeight = [number, number]> {
  name: string;
  weight: TWeight;
  value: number;
  img: string;
}

type CaughtFish = FishTemplate<string>;

const FishModal: React.FC = () => {
  const {
    showFish,
    fish,
    closeFish,
  } = useGameStore() as {
    showFish: boolean;
    fish: CaughtFish; 
    closeFish: () => void;
  };
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showFish) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [showFish]);

  if (!showFish && !isVisible) return null;

  return (
    <div
      className={`modal-box ${isVisible ? 'active' : ''}`}
    >
      <div className={`modal-box__content ${isVisible ? 'active' : ''}`}>
        <h2>Рыба поймана!</h2>

        {/* Карточка рыбы */}
        <div className={`fish-card`}>
          <div>{fish.name}</div>
          <img className='fish-img' src={fish.img}></img>

          <div>
            {fish.weight}кг
          </div>
        </div>
        <button onClick={closeFish}>Хорошо</button>

      </div>
    </div>
  );
}

export default FishModal;