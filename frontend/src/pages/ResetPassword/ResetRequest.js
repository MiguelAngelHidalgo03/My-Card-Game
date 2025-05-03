import { useState } from "react";
<<<<<<< HEAD
import './ResetRequest.css'; // Add this line to import the CSS

=======
import './ResetRequest.css'; 
>>>>>>> 1a8f3d185f0900887b6dd3ab1c0b41aeb31118b2
const ResetRequest = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        // const { error } = await supabase.auth.resetPasswordForEmail(email); parte quitada
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
<<<<<<< HEAD
    <div className="login-container">
      <h1>Recuperar contraseña</h1>
=======
    <div className="reset-request-container">
      <h2>Recuperar contraseña</h2>
>>>>>>> 1a8f3d185f0900887b6dd3ab1c0b41aeb31118b2
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar correo</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ResetRequest;
