import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create the heatmap layer
    const heatLayer = L.heatLayer(
      points.map(({ lat, lng, abundance }) => [lat, lng, abundance]),
      { radius: 25, blur: 15 }
    );
    heatLayer.addTo(map);

    // Add clickable markers with hover effect
    points.forEach(({ lat, lng, abundance }) => {
      const marker = L.circleMarker([lat, lng], {
        radius: 7,
        fillColor: "red",
        color: "#ff7800",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      // Show popup on click
      marker.bindPopup(`<b>Latitude:</b> ${lat}<br><b>Longitude:</b> ${lng}<br><b>Abundance:</b> ${abundance}`);

      // Increase size on hover
      marker.on("mouseover", function () {
        this.setStyle({ radius: 10, fillColor: "orange" }); // Slightly larger & color change
      });

      // Revert back on mouseout
      marker.on("mouseout", function () {
        this.setStyle({ radius: 7, fillColor: "red" }); // Restore original size & color
      });
    });

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
