import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import "./VerifyOtpAndReset.css"; // Asegúrate de tener este archivo CSS para estilos

const VerifyOtpAndReset = () => {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hashParams = window.location.hash;
    if (!hashParams.includes("type=recovery")) {
      setMessage("Token no válido o expirado.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage("Error actualizando la contraseña.");
    } else {
      setMessage("Contraseña cambiada correctamente. Ya puedes iniciar sesión.");
    }
  };

  return (
    <div className="verify-otp-container">
      <h2>Restablecer contraseña</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Cambiar contraseña</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default VerifyOtpAndReset;
