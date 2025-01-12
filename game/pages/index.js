import React, { useEffect, useState } from 'react'; 
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div className="mapPlaceholder">Loading map...</div>,
});

const Game = () => {
  const [locations, setLocations] = useState([]);
  const [randomCity, setRandomCity] = useState('');
  const [randomCityCoordinates, setRandomCityCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [userMarker, setUserMarker] = useState(null);
  const [gameStatus, setGameStatus] = useState('guess');
  const [showMarker, setShowMarker] = useState(false);
  const [distance, setDistance] = useState(null);
  const [lastCityIndex, setLastCityIndex] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        setLocations(data);

        if (data.length > 0) {
          selectRandomCity(data, null);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, []);

  const selectRandomCity = (locations, excludeIndex) => {
    if (locations.length === 0) return;

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * locations.length);
    } while (randomIndex === excludeIndex);

    const selectedCity = locations[randomIndex];
    setRandomCity(selectedCity.name);
    setRandomCityCoordinates({
      latitude: selectedCity.latitude || 0,
      longitude: selectedCity.longitude || 0,
    });
    setLastCityIndex(randomIndex);
  };

  const showRandomCity = () => {
    if (locations.length > 0) {
      selectRandomCity(locations, lastCityIndex);
      setUserMarker(null);
      setShowMarker(false);
      setGameStatus('guess');
      setDistance(null);
    }
  };

  const showActualCity = async () => {
    if (userMarker) {
      try {
        const response = await fetch('/api/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userLat: userMarker.lat,
            userLng: userMarker.lng,
            cityName: randomCity,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate distance.');
        }

        const data = await response.json();

        if (data.length > 0 && data[0].distance !== null) {
          setDistance(data[0].distance.toFixed(2));
          setShowMarker(true);
          setGameStatus('next');
        } else {
          throw new Error('Distance calculation returned invalid data.');
        }
      } catch (error) {
        console.error('Error calculating distance:', error);
        alert('Error calculating distance. Please try again.');
      }
    } else {
      alert('Please place a marker to make a guess.');
    }
  };

  const handleMarkerPlacement = (e) => {
    setUserMarker(e.latlng);
  };

  return (
    <div className="container">
      <h1 className="title">City Identifying Action Game</h1>
      <div id="WhereIs">
        <b>Where is: </b>{randomCity}
      </div>
      <div className="mapContainer">
        <LeafletMap
          locations={locations}
          randomCityCoordinates={randomCityCoordinates}
          userMarker={userMarker}
          showMarker={showMarker}
          handleMarkerPlacement={handleMarkerPlacement}
        />
      </div>
      <div id="Distance">
        {distance !== null && (
          <p>
            You are <strong>{distance} kilometers</strong> away from <strong>{randomCity}</strong>.
          </p>
        )}
      </div>
      <button 
        onClick={gameStatus === 'guess' ? showActualCity : showRandomCity} 
        className="randomCityButton"
      >
        {gameStatus === 'guess' ? 'Guess' : 'Next'}
      </button>
    </div>
  );
};

export default Game;
