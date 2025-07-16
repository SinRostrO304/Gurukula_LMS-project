// src/components/MainContent.jsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Avatar,
  Stack,
  CircularProgress
} from '@mui/material';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function MainContent() {
  const navigate = useNavigate();
  const { teaching, enrolled } = useOutletContext();
  // const { teaching, enrolled, collapsed } = useOutletContext();

  // show spinner if data still loading
  if (!teaching || !enrolled) {
    return <CircularProgress sx={{ mt: 4, mx: 'auto', display: 'block' }} />;
  }

  const renderCard = (cls, showOwner = false) => {
    // teaching cards go to ManageClassPage; enrolled go to LearnClassPage
    const path = showOwner
      ? `/learn/${cls.id}`
      : `/classes/${cls.id}`;

    return (
      <Box key={cls.id} sx={{ width: 240, m: 1 }}>
        <Card>
          <CardActionArea onClick={() => navigate(path)}>
            <CardMedia
              component="img"
              height="140"
              image={
                cls.coverUrl ||
                `https://picsum.photos/seed/${cls.id}/400/140`
              }
              alt={cls.name}
            />
            <CardContent>
              <Typography gutterBottom variant="h6" noWrap>
                {cls.name}
              </Typography>
              {showOwner && cls.ownerPicture && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    src={cls.ownerPicture}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {cls.ownerName}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Teaching Classes
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {teaching.length ? (
          teaching.map((c) => renderCard(c))
        ) : (
          <Typography color="text.secondary">
            You’re not teaching any classes yet.
          </Typography>
        )}
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Enrolled Classes
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {enrolled.length ? (
          enrolled.map((c) => renderCard(c, /* showOwner */ true))
        ) : (
          <Typography color="text.secondary">
            You’re not enrolled in any classes.
          </Typography>
        )}
      </Box>
    </Box>
  );
}