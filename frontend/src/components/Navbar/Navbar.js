// Navbar.jsx
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="navbar">
      {/* Logo como botón de inicio */}
      <Link to="/" className="logo">
        <img src="/assests/img/logo.jpg" alt="Logo" className="logo-image" />
      </Link>
      <ul className="nav-links">
        <li><Link to="/rules">Reglas</Link></li>
        <li><Link to="/about">Sobre Nosotros</Link></li>

        {user ? (
          <li className="user-menu">
            <div onClick={() => setShowMenu(!showMenu)} className="username-button">
              {user.username} ⌄
            </div>

            {showMenu && (
              <ul className="dropdown-menu">
                <li><Link to="/profile">Perfil</Link></li>
                <li><Link to="/config">Configuración</Link></li>
                <li><button onClick={logout}>Salir</button></li>
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
