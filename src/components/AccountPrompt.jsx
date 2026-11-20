// Misafir kullanıcıya hesap açma / giriş yapma düğmesi. Düğme kayıt formunu tam ekran açar;
// oturum açılınca misafir ilerlemesi hesaba taşınır (useAccount).
import { useState } from "react";
import AuthForm from "../screens/onboarding/AuthForm";
import { Button, Overlay } from "./ui";

export default function AccountPrompt({ mode = "signup", children, ...buttonProps }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      {open && (
        <Overlay label={mode === "signup" ? "Hesap oluştur" : "Giriş yap"}>
          <div className="onboarding">
            <AuthForm
              initialMode={mode}
              levelNote="Bu cihazdaki ilerlemen yeni hesabına taşınır, hiçbir şey kaybolmaz."
              onBack={() => setOpen(false)}
            />
          </div>
        </Overlay>
      )}
    </>
  );
}
