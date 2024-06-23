import React, { useState } from 'react';
import axios from 'axios';

const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '100%',
        margin: '0 auto',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    selectContainer: {
        flex: '1',
        marginRight: '10px',
    },
    label: {
        marginBottom: '5px',
        display: 'block',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    select: {
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        boxSizing: 'border-box',
    },
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease',
    },
    graphsContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '20px',
    },
    graphItem: {
        backgroundColor: '#fff',
        padding: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        textAlign: 'center',
    },
    graphImage: {
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px',
    },
    loadingScreen: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        color: '#fff',
        fontSize: '24px',
        flexDirection: 'column', // For vertical alignment of squid and text
    },
    squid: {
        width: '100px',
        height: '100px',
        background: 'url(assets/octopus.gif) no-repeat center center',
        backgroundSize: 'contain',
    }
};

function App() {
  const [year, setYear] = useState('2023');
  const [month, setMonth] = useState('1');
  const [graphs, setGraphs] = useState({});
  const [loading, setLoading] = useState(false); // Loading state

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePredict = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.post('http://localhost:5000/predict', { year, month });
      setGraphs(response.data.graphs);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false); // Stop loading after the fetch is complete
    }
  };

  return (
    <div style={styles.container}>
      {loading && (
        <div style={styles.loadingScreen}>
          <div style={styles.squid}></div>
          <div>Predicting...</div>
        </div>
      )}
      <h1>Indian Squid Graph Analysis</h1>
      <p>Select a year and month to predict the abundance of squid in various hotspots. This tool helps researchers and fishery managers anticipate squid population trends, aiding in sustainable management and conservation efforts.</p>
      <div style={styles.controls}>
        <div style={styles.selectContainer}>
          <label htmlFor="year" style={styles.label}>Year: </label>
          <select id="year" value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div style={styles.selectContainer}>
          <label htmlFor="month" style={styles.label}>Month: </label>
          <select id="month" value={month} onChange={e => setMonth(e.target.value)} style={styles.select}>
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={handlePredict} style={styles.button}>Predict</button>
      <div style={styles.graphsContainer}>
        {Object.entries(graphs).map(([key, url]) => (
          <div key={key} style={styles.graphItem}>
            <h3>Hotspot: {key}</h3>
            <img src={url} alt={`Graph for hotspot ${key}`} style={styles.graphImage} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
