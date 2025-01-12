import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // Importiere dynamic
import ErrorPopup from './ErrorPopup';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
});

export default function Home() {
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLocation, setNewLocation] = useState({ name: '', longitude: '', latitude: '' });
  const [editMode, setEditMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [role, setRole] = useState('admin'); // Neue Variable für die Rolle
  const [errorMessage, setErrorMessage] = useState(''); // Fehlernachricht

  // Funktion zum Abrufen der Städte von der API
  const fetchLocations = async () => {
    try {
      const response = await fetch(`/api/locations?search=${searchTerm}&role=${role}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Abrufen der Daten');
      }
      const data = await response.json();
      setLocations(data);
      setErrorMessage(''); // Fehlernachricht zurücksetzen
    } catch (error) {
      setErrorMessage(`Fehler: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [searchTerm, role]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLocation, role: role }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Hinzufügen der Stadt');
      }
      setNewLocation({ name: '', longitude: '', latitude: '' });
      setSearchTerm('');
      fetchLocations();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleDeleteLocation = async (name) => {
    try {
      const response = await fetch(`/api/locations?name=${name}&role=${role}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Löschen der Stadt');
      }
      fetchLocations();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEditLocation = (location) => {
    setNewLocation({ name: location.name, longitude: location.longitude, latitude: location.latitude });
    setEditMode(true);
    setCurrentLocation(location.name);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/locations?name=${currentLocation}&role=${role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLocation, role: role }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren der Stadt');
      }
      setEditMode(false);
      setNewLocation({ name: '', longitude: '', latitude: '' });
      setSearchTerm('');
      fetchLocations();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setNewLocation({ name: '', longitude: '', latitude: '' });
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setErrorMessage(''); // Fehlernachricht zurücksetzen, wenn die Rolle gewechselt wird
  };

  return (
    <div className="container">
      {/* Zeige das Fehler-Popup, wenn eine Fehlermeldung existiert */}
      {errorMessage && <ErrorPopup message={errorMessage} onClose={() => setErrorMessage('')} />}

      <div className="management">
        <h1 className="title">Städteverwaltung</h1>
        <div className="roleSelection">
          <label>
            <input
              type="radio"
              value="admin"
              checked={role === 'admin'}
              onChange={handleRoleChange}
            />
            Administrator
          </label>
          <label>
            <input
              type="radio"
              value="guest"
              checked={role === 'guest'}
              onChange={handleRoleChange}
            />
            Gast
          </label>
        </div>

        <div className="managementContent">
          <div className="cityList">
            <h2>Stadtliste</h2>
            <input
              type="text"
              placeholder="Stadt suchen..."
              value={searchTerm}
              onChange={handleSearch}
              className="search"
            />
            <ul className="locationList">
              {locations.map((location) => (
                <li key={location.name} className="locationItem">
                  <span className="locationItemContent">
                    {location.name}: {location.longitude}, {location.latitude}
                  </span>
                  <div className="locationItemButtons">
                    <button onClick={() => handleEditLocation(location)}>Bearbeiten</button>
                    <button onClick={() => handleDeleteLocation(location.name)}>Löschen</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="addCity">
            <h2>{editMode ? 'Stadt bearbeiten' : 'Neue Stadt hinzufügen'}</h2>
            <div className="formContainer">
              <form onSubmit={editMode ? handleUpdateLocation : handleAddLocation} className="form">
                <input
                  type="text"
                  placeholder="Name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  required
                  readOnly={editMode} // Das Feld ist nur im Bearbeitungsmodus read-only
                />
                <input
                  type="text"
                  placeholder="Längengrad"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Breitengrad"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                  required
                />
                <button type="submit">{editMode ? 'Speichern' : 'Hinzufügen'}</button>
                {editMode && (
                  <button type="button" onClick={handleCancelEdit} className="cancelButton">
                    Abbrechen
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="mapContainer">
        <LeafletMap locations={locations} />
      </div>
    </div>
  );
}