import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
// import '../components/css/App.css';
import HomePage from './HomePage';
import UploadPage from './UploadPage';
import RetrievePage from './RetrievePage';
import SharePage from './SharePage';
import ProfilePage from './ProfilePage';
// import CloudServicesDemo from './CloudServicesDemo';
import { Web3Provider } from './Web3Context';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="app">
          <header className="app-header">
            <div className="logo">
              <Link to="/">CloudStore</Link>
            </div>
            <nav className="app-nav">
              <Link to="/" className="nav-item">Home</Link>
              <Link to="/upload" className="nav-item">Upload</Link>
              <Link to="/retrieve" className="nav-item">Retrieve</Link>
              <Link to="/share" className="nav-item">Share</Link>
              {/* <Link to="/cloud-services-demo" className="nav-item">Cloud Services</Link> */}
              <Link to="/profile" className="nav-item">Profile</Link>
              
            </nav>
          </header>
          
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/retrieve" element={<RetrievePage />} />
              <Route path="/share" element={<SharePage />} />
              {/* <Route path="/cloud-services-demo" element={<CloudServicesDemo />} /> */}
              <Route path="/profile" element={<ProfilePage />} />
              
            </Routes>
          </main>
          
          <footer className="app-footer">
            <p>© 2025 BlockStore - Decentralized Storage Solutions</p>
          </footer>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;