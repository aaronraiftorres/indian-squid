import React from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom'; // Use NavLink instead of Link
import Home from './pages/Home';
import About from './pages/About';
import Heatmap from './pages/Heatmap';
import Graph from './pages/Graph';

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '100%',
    margin: '0 auto',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 50px',
    backgroundColor: 'transparent', // Remove background
    borderBottom: '2px solid #ccc', // Add this line for the bottom border
  },
  logoImg: {
    height: '150px',
    margin: '0 50px',
    width: '150px',
    cursor: 'pointer', // Add pointer cursor for better UX
  },
  navigation: {
    flex: '1',
    textAlign: 'right',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: '0', // Added left margin
    display: 'flex',
    justifyContent: 'flex-end', // Align links to the left
    alignItems: 'center',
    gap: '50px', // Add space between links
  },
  navLink: {
    textDecoration: 'none',
    color: 'black',
    fontWeight: 'bold',
    margin: '0 18px',
    padding: '5px 10px',
    fontSize: '30px',
    transition: 'color 0.3s ease',
    position: 'relative', // Required for underline effect
    display: 'inline-block',
  },
  activeNavLink: {
    color: '#c44d58', // Active link color
  },
  main: {
    padding: '20px',
    backgroundColor: 'transparent',
    boxShadow: 'none',
  },
};

function App() {
  return (
    <Router>
      <div className="gradient">
        <div style={styles.container}>
          <header style={styles.header}>
            <div className="logo">
              <NavLink to="/">
                <img src="assets/Logo.png" alt="Your Logo" style={styles.logoImg} />
              </NavLink>
            </div>
            <nav style={styles.navigation}>
              <ul style={styles.navList}>
                <li>
                  <NavLink 
                    to="/" 
                    style={({ isActive }) => 
                      isActive ? { ...styles.navLink, ...styles.activeNavLink } : styles.navLink
                    }>
                    Home
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/heatmap" 
                    style={({ isActive }) => 
                      isActive ? { ...styles.navLink, ...styles.activeNavLink } : styles.navLink
                    }>
                    Heatmap
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/graph" 
                    style={({ isActive }) => 
                      isActive ? { ...styles.navLink, ...styles.activeNavLink } : styles.navLink
                    }>
                    Graph
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/about" 
                    style={({ isActive }) => 
                      isActive ? { ...styles.navLink, ...styles.activeNavLink } : styles.navLink
                    }>
                    About Us
                  </NavLink>
                </li>
              </ul>
            </nav>
          </header>

          <main style={styles.main}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/heatmap" element={<Heatmap />} />
              <Route path="/graph" element={<Graph />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
