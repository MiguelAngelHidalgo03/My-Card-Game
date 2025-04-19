import React from 'react';

const Modal = ({ isOpen, onClose, availableImages, selectedImage, handleImageChange, onSave }) => {
  if (!isOpen) return null; 

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar Avatar</h2>
        <div className="profile-image-section">
          <img src={selectedImage} alt="Avatar" className="profile-image" />
          <h3>Selecciona tu avatar:</h3>
          <div className="avatar-options">
            {availableImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Avatar ${index + 1}`}
                className={`avatar-option ${selectedImage === image ? 'selected' : ''}`}
                onClick={() => handleImageChange(image)}
              />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={() => onSave(selectedImage)}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
