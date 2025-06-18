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
  maxWidth={false} // para desactivar valores predefinidos
  PaperProps={{
    className: 'profile-modal-content',
    style: { 
      overflow: 'visible',
      width: 800,  // ancho fijo en px
      maxWidth: '90vw' // que no pase de 90% viewport width
    }
  }}
>
     <Typography
        sx={{
          textAlign: 'center',
          borderBottom: 'none',
          fontSize: '2rem',
          color: 'white',
          fontWeight: 'bold',
          letterSpacing: '0.03em',
          pb: 0,
        }}
      >
        Selecciona tu avatar
     </Typography>

   <DialogContent
  sx={{
    pt: 0,
    pb: 0,
    display: 'flex',
    flexDirection: 'column',
    height: 500,             // o la altura que quieras para el scrollable
  }}
>
  {/* Sticky header */}
  <Box
    sx={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      borderBottom: '2px solid var(--cl-accent3, #2b2d2d)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      py: 2,
    }}
  >
    <Avatar
     src={selectedImage}
     alt="Avatar seleccionado"
     className="actual-avatar"
    />
    <Typography
      variant="subtitle1"
      sx={{ color: 'white', fontWeight: 'bold' }}
    >
      Actual
    </Typography>
  </Box>

  {/* Scrollable area */}
  <Box
    sx={{
      overflowY: 'auto',
      flexGrow: 1,
      pt: 2,
    }}
  >
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
            minWidth: 80,
            minHeight: 80,
          }}
        >
          <Avatar
            src={image}
            alt={`Avatar ${index + 1}`}
            className={selectedImage === image ? 'selected' : ''}
            sx={{
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
  </Box>
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
          className="cancel-button"
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