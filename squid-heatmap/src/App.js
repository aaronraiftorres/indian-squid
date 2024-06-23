import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Heatmap from './pages/Heatmap';
import Graph from './pages/Graph';


// Internal styles
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '100%',
    margin: '0 auto',
    backgroundColor: '#f0f0f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
    borderRadius: '8px 8px 0 0',
    padding: '0 50px', // Adjusted margin for smaller space

  },
  logoImg: {
    height: '150px', 
    margin: '0 50px',
    width: '150px',
  },
  navigation: {
    flex: '1',
    textAlign: 'right',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    fontSize: '20px', // Navigation link font size
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
    margin: '0 18px', // Adjusted margin for smaller space
    padding: '5px 10px', // Adjusted padding for smaller space
    fontSize: '25px', // Reduced font size
    transition: 'color 0.3s ease',
  },
  main: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '0 0 8px 8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
};


function App() {
  return (
    <Router>
      <div style={styles.container}>
        {/* Header with logo and navigation links */}
        <header style={styles.header}>
          <div className="logo">
            {/* Replace with your logo image or text */}
            <img src="assets/Logo.png" alt="Your Logo" style={styles.logoImg} />
          </div>
          <nav style={styles.navigation}>
            <ul style={styles.navList}>
              <li>
                <Link to="/" style={styles.navLink}>Home</Link>
              </li>
              <li>
                <Link to="/about" style={styles.navLink}>About</Link>
              </li>
              <li>
                <Link to="/heatmap" style={styles.navLink}>Heatmap</Link>
              </li>
              <li>
                <Link to="/graph" style={styles.navLink}>Graph</Link>
              </li>
            </ul>
          </nav>
        </header>

        {/* Main content area */}
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/graph" element={<Graph />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
