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
    <div className={`modal-box ${isVisible ? 'active' : ''}`}>
      <div className={`modal-box__content ${isVisible ? 'active' : ''}`}>
        <h2 className="text-xl font-bold text-white">Рыба поймана!</h2>

        {/* Карточка рыбы — уже на Tailwind */}
        <div className="rounded-xl p-4 flex flex-col items-center gap-2 w-full">
          <h3 className="text-lg font-semibold text-white">{fish.name}</h3>

          <img
            className="w-70 h-30 object-fit rounded-lg"
            src={fish.img}
            alt={fish.name}
          />

          <p className="text-base text-gray-500">
            Вес: <span className="font-semibold">{fish.weight}</span> кг
          </p>
        </div>

        <button
          onClick={closeFish}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          Хорошо
        </button>
      </div>
    </div>
  );
}

export default FishModal;