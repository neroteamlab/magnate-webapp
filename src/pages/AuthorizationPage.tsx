import { Button } from "@heroui/react";
import type React from "react";
import { Link } from "react-router";

const AuthorizationPage: React.FC = () => {
  return (
    <div className="top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 space-y-5 w-full max-w-[600px] fixed text-center gap-5 ">
      <h1 className="text-3xl font-semibold">
        Пожалуйста, используйте только авторизованные способы входа в
        приложение!
      </h1>

      <div className="space-x-3">
        <Link to={import.meta.env.VITE_PUBLIC_VK_URL}>
          <Button color="primary">Ссылка на VK</Button>
        </Link>
        <Link to={import.meta.env.VITE_PUBLIC_TELEGRAM_URL}>
          <Button color="success">Ссылка на Telegram</Button>
        </Link>
      </div>
    </div>
  );
};

export default AuthorizationPage;
