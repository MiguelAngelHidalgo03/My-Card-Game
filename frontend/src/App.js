// App.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import BgMountains from "./components/background/BgMountains";
import Home from './pages/Home/Home';
import Rules from './pages/Rules/Rules';
import About from './pages/About/About';
import Config from './pages/Config/Config';
import CreateLobby from './pages/CreateLobby/CreateLobby';
import JoinLobby from './pages/JoinLobby/JoinLobby';
import Lobby from './pages/Lobby/Lobby';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Profile from './pages/Profile/profile';
import ResetRequest from "./pages/ResetPassword/ResetRequest";
import VerifyOtpAndReset from "./pages/ResetPassword/VerifyOtpAndReset";
import AuthCallback from './AuthCallback';
import ScrollToTop from './utils/scrollReset';
import GameCanvas from "./components/GameCanvas/GameCanvas";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Main />
    </Router>
  );
}

function Main() {
  const { pathname } = useLocation();

  return (
    <>
      <Routes>
        <Route path="/"        element={<><BgMountains /><Home/></>} />
        <Route path="/rules"   element={<><BgMountains /><Rules/></>} />
        <Route path="/about"   element={<><BgMountains /><About/></>} />
        <Route path="/config"  element={<><BgMountains /><Config/></>} />
        <Route path="/game/:code" element={<GameCanvas />} />
        <Route path="/create-lobby" element={<CreateLobby />} />
        <Route path="/join-lobby"   element={<JoinLobby />} />
        <Route path="/lobby"        element={<Lobby />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/profile"      element={<Profile />} />
        <Route path="/reset-request" element={<ResetRequest />} />
        <Route path="/reset-password" element={<VerifyOtpAndReset />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* sólo renderiza el Footer si NO estamos en /game */}
    {!pathname.startsWith("/game") && <Footer />}
    </>
  );
}
