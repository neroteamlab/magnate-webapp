import { Input } from "@heroui/react";
import type React from "react";
import { SearchIcon } from "../assets/SearchIcon";
import Game from "../components/ui/Game";

const mockedGames = [
  {
    id: 1,
    title: "Захват",
    image: "/images/sea_battle.jpg",
    href: "/games/occupation",
  },
  {
    id: 2,
    title: "Рыбалка",
    image: "/images/fishing.jpg",
    href: "/games/fishing",
  },
];

const GamesPage: React.FC = () => {
  return (
    <div className="space-y-3">
      <Input startContent={<SearchIcon />} placeholder="Поиск" />

      <div className="flex flex-wrap h-full gap-5">
        {mockedGames.map((game) => (
          <Game
            key={game.id}
            href={game.href}
            title={game.title}
            image={game.image}
          />
        ))}
      </div>
    </div>
  );
};

export default GamesPage;
