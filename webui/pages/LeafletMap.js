import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMap = ({ locations }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current).setView([51.1657, 10.4515], 5);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        subdomains: ['a', 'b', 'c']
      }).addTo(map);
      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isMapReady && mapInstanceRef.current) {
      const updateMap = () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        const customIcon = L.icon({
          iconUrl: '/marker.png',
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38]
        });

        const bounds = L.latLngBounds();

        locations.forEach(location => {
          if (location.latitude !== undefined && location.longitude !== undefined) {
            const marker = L.marker([location.latitude, location.longitude], { icon: customIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(location.name);
            bounds.extend([location.latitude, location.longitude]);
            markersRef.current.push(marker);
          }
        });

        if (!bounds.isValid()) {
          mapInstanceRef.current.setView([51.1657, 10.4515], 5);
        } else {
          mapInstanceRef.current.fitBounds(bounds, {maxZoom: 10});
        }
      };

      const timeoutId = setTimeout(updateMap, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [locations, isMapReady]);

  return <div id="map" className='map' ref={mapRef}></div>;
};

export default LeafletMap;