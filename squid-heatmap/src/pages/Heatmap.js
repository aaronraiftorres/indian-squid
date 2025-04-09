import React, { useState } from 'react';
import axios from 'axios';

// Internal styles
const styles = {
  // ... (keep all your existing styles)
};

const AbundanceLegend = () => {
  // ... (keep your existing AbundanceLegend component)
};

const Heatmap = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [heatmapHtml, setHeatmapHtml] = useState(null);
  const [mapVisible, setMapVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hotspotDetails, setHotspotDetails] = useState(null);
  const [error, setError] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePredict = () => {
    setShowModal(true);
    setError(null);
  };

  const handleModalContinue = async () => {
    setShowModal(false);
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/predict`,
        { year: selectedYear, month: selectedMonth },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.heatmaps?.length > 0) {
        setHeatmapHtml(response.data.heatmaps[0]);
        setMapVisible(false);
      }
      if (response.data.hotspot_details) {
        setHotspotDetails(response.data.hotspot_details);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Prediction failed. Please try again later.');
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
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalSquid}></div>
            <div style={styles.modalText}>
              <p>Please note that the predictions are based on simulated data and may not fully reflect actual conditions.</p>
              <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                The longer the date you want to predict, the accuracy becomes poorer.
              </p>
            </div>
            <button 
              style={styles.modalButton} 
              onClick={handleModalContinue}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          margin: '10px 0',
          backgroundColor: '#ffeeee',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <h1>Indian Squid Heatmap Analysis</h1>
      <p>Select a year and month to predict the abundance of squid in various hotspots. This tool helps researchers and fishery managers anticipate squid population trends, aiding in sustainable management and conservation efforts.</p>

      <div style={styles.controls}>
        <div style={styles.selectContainer}>
          <label htmlFor="year" style={styles.label}>Select Year:</label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={styles.select}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <div style={styles.selectContainer}>
          <label htmlFor="month" style={styles.label}>Select Month:</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={styles.select}
          >
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handlePredict} style={styles.button}>
          Predict
        </button>
      </div>

      {heatmapHtml && (
        <div style={styles.result}>
          <h3>Generated Heatmap for {monthNames[selectedMonth - 1]} {selectedYear}</h3>
          <div dangerouslySetInnerHTML={{ __html: heatmapHtml }} />
          <AbundanceLegend />
        </div>
      )}

      {mapVisible && (
        <div style={styles.result}>
          <h3 style={styles.mapHeader}>Default Map (OpenStreetMap in Northern Iloilo, Visayan Sea)</h3>
          <div style={styles.mapContainer}>
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=123.0,11.0,123.5,11.5&layer=mapnik"
              style={{ width: '100%', height: '100%' }}
              title="Default Map"
            />
            <AbundanceLegend />
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;