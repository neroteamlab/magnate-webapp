import React from "react";
import GameCanvas from "../../components/shared/GameCanvas";
import FishModal from "../../components/fishing/FishModal";
import FishCatchingGame from "../../components/fishing/FishCatchingGame";

const FishingPage: React.FC = () => {
    return (
        <div className="w-full h-full bg-[#1e3d59]">
            <GameCanvas />
            <FishCatchingGame/>
            <FishModal/>
        </div>
    );
}

export default FishingPage;