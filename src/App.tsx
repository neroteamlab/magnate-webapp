import React from "react";
import { Route, Routes } from "react-router-dom";
import { checkAuth } from "./api/profileApi";
import SideBar from "./components/shared/SideBar";
import AuthorizationPage from "./pages/AuthorizationPage";
import GiveawayPage from "./pages/GiveawayPage";
import GamesPage from "./pages/GamesPage";
import ProfilePage from "./pages/ProfilePage";
import OccupationPage from "./pages/games/OccupationPage";
import { useHashAdapter } from "./utils/hooks/hashPathAdapter";

const App: React.FC = () => {
  const [isAuth, setIsAuth] = React.useState<boolean>(false);
  const [pending, setPending] = React.useState<boolean>(true);
  const isGiveawayRoute = window.location.pathname.startsWith("/giveaway");

  useHashAdapter();

  React.useEffect(() => {
    if (isGiveawayRoute) {
      setPending(false);
      return;
    }

    const fetchAuthResult = async () => {
      setPending(true);
      const { success } = await checkAuth();

      setIsAuth(success);
      setPending(false);
    };

    fetchAuthResult();
  }, [isGiveawayRoute]);

  if (isGiveawayRoute) {
    return (
      <Routes>
        <Route path="/giveaway/:id" element={<GiveawayPage />} />
        <Route path="/giveaway" element={<GiveawayPage />} />
      </Routes>
    );
  }

  if (!isAuth && !pending) return <AuthorizationPage />;

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-full">
        <div className="p-3 pb-20">
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/occupation/:id" element={<OccupationPage />} />
            <Route path="/games/occupation" element={<OccupationPage />} />
            {/* <Route path="*" element={<Navigate to="/games" />} /> */}
          </Routes>
        </div>
        <SideBar />
      </div>
    </div>
  );
};

export default App;
