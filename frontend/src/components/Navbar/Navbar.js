import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import './Navbar.css';
import {useTheme, useMediaQuery } from '@mui/material';

function Navbar() {
  const { user, logout } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleMenu = () => setShowMenu(prev => !prev);

  // Detecta scroll para cambiar estilo navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isColoredBackground = ["/login", "/register", "/reset-request", "/reset-password"].includes(location.pathname);

  // Altura del navbar depende si se hizo scroll o no
  const navbarHeight = isMobile? isScrolled ? 50 : 60 : isScrolled ? 60 : 70;

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''} ${isColoredBackground ? 'navbar-colored' : ''}`}>
      <Link to="/" reloadDocument className="logo">
        <img src="/assests/img/Logo_Grande.svg" alt="Logo" className="logo-image" />
      </Link>

      <ul className="nav-links">
        <li><Link to="/ranking" reloadDocument>Clasificación</Link></li>
        <li><Link to="/test" reloadDocument>Test</Link></li>
        <li><Link to="/rules" reloadDocument>Reglas</Link></li>
        <li><Link to="/about" reloadDocument>Sobre Nosotros</Link></li>

        {user ? (
          <li className="user-menu">
            <div onClick={toggleMenu} className={`username-button ${showMenu ? 'moved' : ''}`}>
              <img src={user.profile_picture} alt="Avatar" className="navbar-avatar" />
            </div>

            {showMenu && (
              <ul
                className="dropdown-menu"
                style={{
                  position: 'fixed',
                  top: `${navbarHeight}px`,
                  right: 0,
                  transform: 'none', // sin translateY, para que quede pegado abajo
                }}
              >
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
