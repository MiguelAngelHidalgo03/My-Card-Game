import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Avatar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import './ModalProfile.css';

const Modal = ({
  isOpen,
  onClose,
  availableImages,
  selectedImage,
  handleImageChange,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        className: 'profile-modal-content',
        style: { overflow: 'visible' }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          borderBottom: 'none',
          fontSize: '2rem',
          color: 'var(--cl-accent2, #272725)',
          fontWeight: 'bold',
          letterSpacing: '0.03em',
          pb: 0,
        }}
      >
        Selecciona tu avatar
      </DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 0 }}>
        {/* Avatar grande actual */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={selectedImage}
            alt="Avatar seleccionado"
            sx={{
              width: 110,
              height: 110,
              border: '3px solid var(--cl-accent3, #2b2d2d)',
              boxShadow: '0 2px 8px var(--cl-shadow, #00000022)',
              background: '#fff',
              mb: 1,
            }}
          />
          <Typography variant="subtitle1" sx={{ color: 'var(--cl-accent2, #272725)', fontWeight: 'bold' }}>
            Actual
          </Typography>
        </Box>

        {/* Grid de avatares */}
        <Grid container spacing={2} justifyContent="center">
          {availableImages.map((image, index) => (
         <Grid
  item
  xs={4}
  sm={3}
  key={index}
  sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80, // Asegura espacio extra para el hover
    minHeight: 80,
    // Puedes ajustar estos valores según el tamaño máximo del avatar escalado
  }}
>
              <Avatar
                src={image}
                alt={`Avatar ${index + 1}`}
                className={selectedImage === image ? 'selected' : ''}
                sx={{
                  width: 64,
                  height: 64,
                  cursor: 'pointer',
                  border: selectedImage === image
                    ? '3px solid var(--cl-accent4, #d2f562)'
                    : '3px solid transparent',
                  boxShadow: selectedImage === image
                    ? '0 0 12px #ffe95a55'
                    : '0 2px 8px var(--cl-shadow, #00000022)',
                  background: '#fff',
                  transition: 'transform 0.18s, border-color 0.18s, box-shadow 0.18s',
                  '&:hover': {
                    borderColor: 'var(--cl-accent3, #2b2d2d)',
                    transform: 'scale(1.08)',
                  },
                }}
                onClick={() => handleImageChange(image)}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      {/* Botones abajo */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          px: 4,
          py: 2,
          mt: 2,
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          onClick={onClose}
          sx={{
            fontWeight: 'bold',
            borderRadius: '1.2rem',
            border: '2.5px solid var(--cl-accent2, #272725)',
            color: 'var(--cl-accent2, #272725)',
            background: '#fff',
            px: 3,
            py: 1,
            '&:hover': {
              background: 'var(--cl-accent4, #d2f562)',
              color: 'var(--cl-accent2, #272725)',
              borderColor: 'var(--cl-accent4, #d2f562)',
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onSave(selectedImage)}
          sx={{
            fontWeight: 'bold',
            borderRadius: '1.2rem',
            border: '2.5px solid var(--cl-accent2, #272725)',
            color: '#fff',
            background: 'var(--cl-accent3, #2b2d2d)',
            px: 3,
            py: 1,
            boxShadow: '0 2px 8px var(--cl-shadow, #00000022)',
            '&:hover': {
              background: 'var(--cl-accent4, #d2f562)',
              color: 'var(--cl-accent2, #272725)',
              borderColor: 'var(--cl-accent4, #d2f562)',
            },
          }}
        >
          Guardar
        </Button>
      </Box>
    </Dialog>
  );
};

export default Modal;