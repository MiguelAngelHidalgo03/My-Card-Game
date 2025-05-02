import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import './ResetRequest.css'; // Add this line to import the CSS

const VerifyOtpAndReset = () => {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Hook to handle navigation

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
    <div className="login-container">
      <h1>Restablecer contraseña</h1>
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
