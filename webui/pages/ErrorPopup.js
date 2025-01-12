import React from 'react';

export default function ErrorPopup({ message, onClose }) {
  return (
    <div className="errorOverlay">
      <div className="errorPopup">
        <p>{message}</p>
        <button onClick={onClose}>Schließen</button>
      </div>
    </div>
  );
}
