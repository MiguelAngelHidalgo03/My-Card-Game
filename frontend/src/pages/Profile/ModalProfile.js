import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Avatar,
  Typography,
  Button,
} from '@mui/material';

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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#fff', // Fondo blanco sólido
          boxShadow: 'none',
          borderRadius: 3,
          border: 'none',
          position: 'relative', // para manejar el svg si quieres
          overflow: 'visible',
        }
      }}
    >
      {/* Aquí podrías insertar un svg de fondo con posición absoluta si quieres */}
      {/* <div className="modal-bg-svg">...svg aquí...</div> */}

      <DialogTitle
        sx={{
          textAlign: 'center',
          borderBottom: 'none',
          fontSize: '1.5rem',
          paddingBottom: 0,
          color: '#222',
          fontWeight: 'bold',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Editar Avatar
      </DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 0, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={4} sx={{ textAlign: 'center', mt: 2 }}>
            <Avatar
              src={selectedImage}
              alt="Avatar seleccionado"
              sx={{
                width: 130,
                height: 130,
                margin: '0 auto',
                border: '3px solid black',
              }}
            />
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Actual
            </Typography>
          </Grid>

          <Grid item xs={12} sm={8}>
            <Typography variant="subtitle1" sx={{ mb: 1, mt: 1 }}>
              Selecciona tu avatar:
            </Typography>
            <Grid container spacing={2}>
              {availableImages.map((image, index) => (
                <Grid item xs={4} sm={4} key={index}>
                  <Avatar
                    src={image}
                    alt={`Avatar ${index + 1}`}
                    sx={{
                      width: 64,
                      height: 64,
                      cursor: 'pointer',
                      border:
                        selectedImage === image
                          ? '2px solid #3f51b5'
                          : '2px solid transparent',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                    onClick={() => handleImageChange(image)}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Botones MUI */}
      <Grid
        container
        spacing={2}
        sx={{
          px: 3,
          py: 2,
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'transparent',
          borderTop: 'none',
        }}
      >
        <Grid item>
          <Button variant="outlined" color="primary" onClick={onClose}>
            Cancelar
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="primary" onClick={() => onSave(selectedImage)}>
            Guardar
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default Modal;
