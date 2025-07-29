import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import '../styles/components/Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <div className="main-container">
        <Navigation />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
