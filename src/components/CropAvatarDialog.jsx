// src/components/CropAvatarDialog.jsx
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Slider, Button, Box
} from '@mui/material';

export default function CropAvatarDialog({
  open, onClose, imageFile, onCropComplete, uploading
}) {
  const [crop, setCrop]     = useState({ x: 0, y: 0 });
  const [zoom, setZoom]     = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const imageSrc = URL.createObjectURL(imageFile);

  const onCropChange   = useCallback(c => setCrop(c), []);
  const onZoomChange   = useCallback(z => setZoom(z), []);
  const onCropDone     = useCallback((_, areaPixels) => setCroppedArea(areaPixels), []);

  const handleSave = async () => {
    const blob = await getCroppedImg(imageSrc, croppedArea);
    onCropComplete(blob);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crop Your Avatar</DialogTitle>
      <DialogContent sx={{ position: 'relative', height: 360 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropDone}
        />
      </DialogContent>
      <Box sx={{ px: 3 }}>
        <Slider
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e, v) => setZoom(v)}
        />
      </Box>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={!croppedArea || uploading}
          variant="contained"
        >
          {uploading ? 'Uploading…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}