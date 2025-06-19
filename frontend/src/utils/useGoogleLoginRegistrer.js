import { useEffect } from 'react';
import axios from 'axios';
import { supabase } from "./supabaseClient";

// Utiliza las variables del cliente ya creado
const supabaseUrl = supabase.supabaseUrl;
const supabaseAnonKey = supabase.supabaseKey || process.env.REACT_APP_SUPABASE_ANON_KEY;

export const handleGoogleLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
  } catch (err) {
    console.error('Error durante el login con Google:', err);
  }
};

const isGoogleUrl = (url) => url?.includes('googleusercontent.com');

const enhanceGoogleAvatarQuality = (url) => {
  if (!url) return url;
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=s\d+-c$/, '=s96-c');
  }
  return url;
};

/**
 * Hook para usar en componentes Register y Login
 * @param {function} loginFunc función que actualiza el contexto de usuario (ej: login del UserContext)
 * @param {function} navigateFunc función para navegar (ej: useNavigate de react-router)
 */
export const logout = async (loginFunc, navigateFunc) => {
  await supabase.auth.signOut();
  localStorage.clear();
  sessionStorage.clear();
  if (typeof loginFunc === 'function') loginFunc(null);
  if (typeof navigateFunc === 'function') navigateFunc('/login');
};
export const useGoogleAuthListener = (loginFunc, navigateFunc) => {
  // Al montar, si la sesión es inválida, haz logout y limpia el estado
  useEffect(() => {
    const checkSession = async () => {
      const session = supabase.auth.getSession
        ? (await supabase.auth.getSession()).data.session
        : supabase.auth.session?.();
      if (session && session.provider_token && session.user?.aud === 'authenticated') {
        // Si hay sesión pero el usuario no existe, intenta obtenerlo
        const responseUser = await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseAnonKey,
          },
        });
        if (!responseUser.ok) {
          // Si el usuario no existe, haz logout y limpia todo
          await supabase.auth.signOut();
          if (typeof loginFunc === 'function') loginFunc(null);
          localStorage.removeItem('google_avatar');
          if (typeof navigateFunc === 'function') navigateFunc('/login');
        }
      }
    };
    checkSession();
  }, [loginFunc, navigateFunc]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          const access_token = session.access_token;

          // Obtener datos del usuario desde Supabase Auth
          const responseUser = await fetch(`${supabaseUrl}/auth/v1/user`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${access_token}`,
              apikey: supabaseAnonKey,
            },
          });

          if (!responseUser.ok) {
            const errorText = await responseUser.text();
            console.error('No se pudo obtener el usuario desde Supabase Auth:', errorText);

            // Si el error es 403 y user_not_found, forzar logout y limpiar contexto
            if (responseUser.status === 403 && errorText.includes('user_not_found')) {
              await supabase.auth.signOut();
              if (typeof loginFunc === 'function') {
                loginFunc(null); // Limpia el contexto de usuario
              }
              localStorage.removeItem('google_avatar');
              // Opcional: redirige a login
              if (typeof navigateFunc === 'function') {
                navigateFunc('/login');
              }
            }
            return;
          }

          const userData = await responseUser.json();
          const googleAvatarFromAuth = enhanceGoogleAvatarQuality(userData?.user_metadata?.avatar_url || null);

          // Autenticar contra tu backend
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/google-auth`, {
            access_token,
          });

          if (response.status === 200) {
            const { user } = response.data;

            let finalProfilePicture = user.profile_picture;

            const shouldUpdateGoogleAvatar =
              isGoogleUrl(user.profile_picture) &&
              isGoogleUrl(googleAvatarFromAuth) &&
              user.profile_picture !== googleAvatarFromAuth;

            // Si el avatar debe actualizarse en la BBDD
            if (shouldUpdateGoogleAvatar) {
              try {
                await fetch(`${process.env.REACT_APP_API_URL}/update-avatar`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access_token}`,
                  },
                  body: JSON.stringify({
                    userId: user.user_id,
                    profile_picture: googleAvatarFromAuth,
                  }),
                });
                finalProfilePicture = googleAvatarFromAuth;
              } catch (err) {
                console.error('Error actualizando avatar de Google en la BBDD:', err);
              }
            }

            // Login en el contexto y guardar localmente
            loginFunc({
              username: user.username,
              userId: user.user_id,
              profile_picture: finalProfilePicture || '/assets/img/avatar1.png',
              token: access_token,
            });

            if (googleAvatarFromAuth) {
              localStorage.setItem('google_avatar', googleAvatarFromAuth);
            }

            navigateFunc('/');
          }
        } catch (err) {
          console.error('Error al autenticar en el backend:', err);
        }
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [loginFunc, navigateFunc]);
};