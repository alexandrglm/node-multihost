import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

import NavBar from '../navigation/Navbar.jsx';
import Footer from '../commons/Footer';
import AppWebshell from '../webshell/App-Webshell';
import DailySmartyUI from './DailySmarty';

import '../../styles/main.scss';

const Index = () => {
  
  const { theme } = useSelector(state => state.app);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* WebShell CON layout */}
        <Route path="/" element={
          <div className="app">
            <NavBar />
            <div className='body-wrapper'>
              <AppWebshell />
            </div>
            <Footer />
          </div>
        } />

        {/* DailySmarty SIN layout */}
        <Route path="/project-five/*" element={<DailySmartyUI />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Index;