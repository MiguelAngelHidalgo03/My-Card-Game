// src/utils/useGoogleAuth.js
import { createClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import axios from 'axios';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleGoogleLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
  } catch (error) {
    console.error('Error durante el login con Google:', error);
  }
};

const isGoogleUrl = (url) => url?.includes('googleusercontent.com');

const enhanceGoogleAvatarQuality = (url) => {
  if (!url) return url;
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=s\d+-c$/, '=s130-c');
;
  }
  return url;
};

/**
 * Hook para usar en componentes Register y Login
 * @param {function} loginFunc función que actualiza el contexto de usuario (ej: login del UserContext)
 * @param {function} navigateFunc función para navegar (ej: useNavigate de react-router)
 */
export const useGoogleAuthListener = (loginFunc, navigateFunc) => {
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
            console.error('No se pudo obtener el usuario desde Supabase Auth:', await responseUser.text());
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

export default supabase;
