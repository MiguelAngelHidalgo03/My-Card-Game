// Navbar.jsx
import { useContext, useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import './Navbar.css';
function Navbar() {
  const { user, logout } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // Estado para detectar el scroll
  const location = useLocation(); 

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Determina si la ruta actual requiere un fondo de color
  const isColoredBackground = ["/login", "/register", "/reset-request", "/reset-password"].includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true); // Si el usuario hace scroll, activa el estado
      } else {
        setIsScrolled(false); // Si el usuario vuelve al tope, desactiva el estado
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll); // Limpia el listener al desmontar
    };
  }, []);


  return (
    <nav
    className={`navbar ${isScrolled ? 'navbar-scrolled' : ''} ${
      isColoredBackground ? 'navbar-colored' : ''
    }`}
  >    {/* Logo como botón de inicio */}
      <Link to="/" reloadDocument className="logo">
        <img src="/assests/img/logo.jpg" alt="Logo" className="logo-image" />
      </Link>
      <ul className="nav-links">
        <li><Link to="/rules" reloadDocument>Reglas</Link></li>
        <li><Link to="/about" reloadDocument>Sobre Nosotros</Link></li>

        {user ? (
          <li className="user-menu">
            <div
              onClick={toggleMenu}
              className={`username-button ${showMenu ? 'moved' : ''}`}
            >
              {/* {user.username} */}
              <img
                src={user.profile_picture}
                alt="Avatar"
                className="navbar-avatar"
              />
            </div>

            {showMenu && (
              <ul className="dropdown-menu">
                {/* Nombre del usuario en un recuadro */}
                <div className="user-info">{user.username}</div>
                <li><Link to="/profile" reloadDocument>Perfil</Link></li>
                <li><Link to="/config" reloadDocument>Cuenta</Link></li>
                <li><Link to="/" reloadDocument><button onClick={logout}>Salir</button></Link></li>
              </ul>
            )}
          </li>
        ) : (
          <li><Link to="/login">Iniciar sesión</Link></li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;