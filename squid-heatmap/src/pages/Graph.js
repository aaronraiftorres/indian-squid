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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    color: '#333',
    fontSize: '24px',
    flexDirection: 'column',
    gap: '30px',
  },
  squid: {
    width: '250px',
    height: '200px',
    background: 'url(assets/octopus.gif) no-repeat center center',
    backgroundSize: 'contain',
    animation: 'bounce 1.5s ease-in-out infinite',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 2000,
    textAlign: 'center',
    maxWidth: '500px',
    width: '90%',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modalText: {
    marginBottom: '20px',
  },
  modalSquid: {
    width: '100px',
    height: '100px',
    background: 'url(assets/octopus.gif) no-repeat center center',
    backgroundSize: 'contain',
    marginBottom: '20px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1500,
  },
  modalButton: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  }
};

function App() {
  const [year, setYear] = useState('2024');
  const [month, setMonth] = useState('1');
  const [graphs, setGraphs] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePredict = async () => {
    setShowModal(true);
  };

  const confirmPredict = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/predict`, 
        { year, month },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      setGraphs(response.data.graphs);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      if (error.response) {
        // Server responded with a status other than 200 range
        alert(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        alert('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request
        alert('Error setting up request: ' + error.message);
      }
    } finally {
      setLoading(false);
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

      {showModal && (
        <>
          <div style={styles.overlay}></div>
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalSquid}></div>
              <div style={styles.modalText}>
                <p>Please note that the prediction is based on historical data and may not be entirely accurate. Proceed with caution.</p>
                <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                  The longer the date you want to predict, the accuracy becomes poorer.
                </p>
              </div>
              <button style={styles.modalButton} onClick={confirmPredict}>Continue</button>
            </div>
          </div>
        </>
      )}

      <h1>Indian Squid Graph Analysis</h1>
      <p>Select a year and month to predict the abundance of squid in various hotspots. This tool helps researchers and fishery managers anticipate squid population trends, aiding in sustainable management and conservation efforts.</p>

      <div style={styles.controls}>
        <div style={styles.selectContainer}>
          <label htmlFor="year" style={styles.label}>Year: </label>
          <select id="year" value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
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