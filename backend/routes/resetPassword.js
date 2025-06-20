// Asegúrate de que tu proyecto esté usando ES Modules (package.json con "type": "module")

import express from "express";
import supabase from "../utils/supabaseClient.js"; // Asegúrate de que la ruta sea correcta

const router = express.Router();

// Ruta para solicitar restablecimiento de contraseña
router.post("/reset-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "El correo electrónico es obligatorio" });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://www.1pa1.xyz/reset-password",
      });

    if (error) {
      console.error("Error al enviar el correo de restablecimiento:", error.message);
      return res.status(500).json({ error: "Error al enviar el correo de restablecimiento" });
    }

    return res.status(200).json({ message: "Correo de restablecimiento enviado exitosamente" });
  } catch (err) {
    console.error("Error general en resetPassword:", err);
    return res.status(500).json({ error: "Error inesperado al enviar el correo de restablecimiento" });
  }
});

export default router;
