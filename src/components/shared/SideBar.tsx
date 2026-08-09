import React from "react";
import { NavLink } from "react-router";
import { HomeIcon } from "../../assets/HomeIcon";
import { ProfileIcon } from "../../assets/ProfileIcon";
import { cn } from "../../utils/classNames";

const sections = [
  {
    href: "games",
    label: "Games",
    icon: <HomeIcon />,
  },
  {
    href: "profile",
    label: "Profile",
    icon: <ProfileIcon />,
  },
];

const SideBar: React.FC = () => {
  return (
    <footer className="flex z-[100] justify-stretch min-h-[57px] fixed bottom-0 left-1/2 bg-[#111] p-3 -translate-x-1/2 w-full">
      {sections.map((section) => (
        <NavLink to={section.href} key={section.href} className={"w-full"}>
          {({ isActive }) => (
            <div
              className={cn(
                "w-full flex flex-col justify-center items-center",
                isActive ? "text-[#6155F5]" : "text-[#838383] "
              )}
            >
              {section.icon}
              {section.label}
            </div>
          )}
        </NavLink>
      ))}
    </footer>
  );
};

export default SideBar;
