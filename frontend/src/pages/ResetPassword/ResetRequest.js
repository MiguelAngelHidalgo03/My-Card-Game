import { useState } from "react";
import './ResetRequest.css';

const ResetRequest = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(res.ok ? data.message : data.error);
    } catch (err) {
      setMessage("Error al conectar con el servidor");
    }
  };

  return (
    <div className="reset-wrapper">
      <div className="reset-box">
        <h1>Recuperar contraseña</h1>
        <form className="reset-form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="reset-input"
            placeholder="Introduce tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="reset-btn">Enviar correo</button>
        </form>
        {message && <p className="reset-message">{message}</p>}
      </div>
    </div>
  );
};

export default ResetRequest;