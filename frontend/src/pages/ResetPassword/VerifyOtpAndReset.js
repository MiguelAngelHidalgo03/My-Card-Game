import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import './ResetRequest.css';

const VerifyOtpAndReset = () => {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

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
      setMessage("Error actualizando la contraseña no se permite poner la misma.");
    } else {
      setMessage("Contraseña cambiada correctamente. Ya puedes iniciar sesión.");
      setTimeout(() => {
        navigate('/login', { state: { resetPasswordSuccess: true } });
      }, 2000);
    }
  };

  return (
    <div className="reset-wrapper">
      <div className="reset-box">
        <h1>Restablecer contraseña</h1>
        <div className="reset-verify-container">
          <form className="reset-form" onSubmit={handleSubmit}>
            <input
              type="password"
              className="reset-input"
              placeholder="Introduzca nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="submit" className="reset-btn">Cambiar contraseña</button>
          </form>
          {message && <p className="reset-message">{message}</p>}
        </div>
      </div>
    </div>
  );
};
export default VerifyOtpAndReset;
