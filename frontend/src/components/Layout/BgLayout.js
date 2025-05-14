// src/layouts/BgLayout.jsx
import { Outlet } from 'react-router-dom';
import BgMountains from '../background/BgMountains';


export default function BgLayout() {
  return (
    <>
      <BgMountains />
      <Outlet/>
    </>
  );
}
