import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const AuthCallback = () => {
  const navigate = useNavigate()

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    // Obtiene los tokens del hash de la URL
    const hash = window.location.hash
    const query = new URLSearchParams(hash.replace('#', '?'))

    const access_token = query.get('access_token')
    const refresh_token = query.get('refresh_token')

    if (access_token && refresh_token) {
      // Configura la sesión con los tokens
      supabase.auth
        .setSession({
          access_token: access_token,
          refresh_token: refresh_token,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error al restaurar la sesión:', error.message)
          } else {
            // console.log('Sesión restaurada y email actualizado correctamente.')
          }

          navigate('/')  
        })
    }
  }, [navigate, supabase])

  return <p>Confirmando tu nuevo correo...</p>
}

export default AuthCallback
