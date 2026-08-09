import type React from "react";
import { cn } from "../../utils/classNames";
import { Link } from "react-router";

interface IProps {
  title: string;
  image?: string;
  href: string;
}

const Game: React.FC<IProps> = ({ title, image, href }) => {
  return (
    <Link
      to={href}
      style={{ backgroundImage: `url(${image})` }}
      className={cn(
        image
          ? `bg-center bg-cover shadow-[inset_0_150px_300px_0_rgba(0,0,0,0.6)]`
          : "bg-[#333] hover:bg-[#444]",
        "text-lg transition-all rounded-lg p-3 h-[150px] w-[150px] flex items-end"
      )}
    >
      {title}
    </Link>
  );
};

export default Game;
