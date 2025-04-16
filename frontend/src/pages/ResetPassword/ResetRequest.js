import { useState } from "react";

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
    <div>
      <h2>Recuperar contraseña</h2>
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
