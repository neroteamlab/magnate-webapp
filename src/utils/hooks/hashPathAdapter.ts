import React from "react";
import { useNavigate } from "react-router";

export const useHashAdapter = () => {
  const navigate = useNavigate();
  const handledRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const hash = window.location.hash;

    if (!hash) return;

    const path = hash.replace("#", "");

    if (!(path.startsWith("games") || path.startsWith("/games"))) return;
    if (path.startsWith("/")) {
      navigate(path, { replace: true });
    } else {
      navigate(`/${path}`, { replace: true });
    }

    history.replaceState(null, "", window.location.pathname);
  }, [navigate]);

  return null;
};
