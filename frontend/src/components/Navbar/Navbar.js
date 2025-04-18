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
      <h1 className="logo">1pa1</h1>
      <ul className="nav-links">
        <li><Link to="/">Inicio</Link></li>

        {user ? (
          <li className="user-menu">
            <div onClick={() => setShowMenu(!showMenu)} className="username-button">
            {user.username} 
              <span className="arrow">{showMenu ? '▲' : '▼'}</span>
            </div>

            {showMenu && (
              <ul className="dropdown-menu">
                <li><Link to="/profile">Perfil</Link></li>
                <li><Link to="/account">Cuenta</Link></li>
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
