import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ randomCityCoordinates, userMarker, handleMarkerPlacement, showMarker }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current).setView([51.1657, 10.4515], 6); 
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 16,
        minZoom: 5,
        
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('click', (e) => {
        handleMarkerPlacement(e);
      });
    }
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (map) {
 
      Object.values(map._layers).forEach((layer) => {
        if (layer.options.icon?.options.iconUrl === '/marker.png') {
          map.removeLayer(layer);
        }
      });

      if (userMarker) {
        const userIcon = L.icon({
          iconUrl: '/marker.png',
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38],
        });
        L.marker([userMarker.lat, userMarker.lng], { icon: userIcon }).addTo(map);
      }
    }
  }, [userMarker]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (map) {
      // Clear existing city marker
      Object.values(map._layers).forEach((layer) => {
        if (layer.options.icon?.options.iconUrl === '/markerGreen.png') {
          map.removeLayer(layer);
        }
      });

      // Add the city marker if `showMarker` is true
      if (showMarker && randomCityCoordinates.latitude && randomCityCoordinates.longitude) {
        const greenIcon = L.icon({
          iconUrl: '/markerGreen.png',
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38],
        });
        L.marker([randomCityCoordinates.latitude, randomCityCoordinates.longitude], { icon: greenIcon }).addTo(map);
      }
    }
  }, [randomCityCoordinates, showMarker]);

  return <div ref={mapRef} className="map" />;
};

export default LeafletMap;
