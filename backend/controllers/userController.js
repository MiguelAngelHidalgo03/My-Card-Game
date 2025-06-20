// controllers/userController.js
import supabase from '../utils/supabaseClient.js';

export const createUser = async (req, res) => {
  const { username, email, password, profile_picture, language } = req.body;

  // Validar el formato del email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'El correo electrónico no es válido' });
  }

  // Validar que todos los campos sean obligatorios
  if (!username || !email || !password || !profile_picture || !language) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

 // Validar que las contraseñas sean correctas
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!passwordRegex.test(password)) {
  return res.status(400).json({
    error: 'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una minúscula, un número y un carácter especial'
  });
}

  // Crear un usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  // Crear un nuevo usuario en la tabla 'users'
  const { user } = authData;
  const { data, error } = await supabase
    .from('users')
    .insert([{
      user_id: user.id, // Relacionar con el ID del usuario en Supabase Auth
      username,
      email,
      profile_picture,
      language,
    }]);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({ message: 'Usuario creado exitosamente', data });
};

