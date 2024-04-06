import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

export default function TicketPurchaseCard({cardImg, concertName, concertLoc, category, ticketCost}) {
    const theme = useTheme();

    return (
        <Card sx={{ display: 'flex' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <CardMedia
                    component="img"
                    sx={{ width: 151 }}
                    image={cardImg}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography component="div" variant="h5">
                        Live From Space
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="div">
                        Mac Miller
                    </Typography>
                </CardContent>
                {/* <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pl: 1, pb: 1 }}>
                            <IconButton aria-label="previous">
                                {theme.direction === 'rtl' ? <SkipNextIcon /> : <SkipPreviousIcon />}
                            </IconButton>
                            <IconButton aria-label="play/pause">
                                <PlayArrowIcon sx={{ height: 38, width: 38 }} />
                            </IconButton>
                            <IconButton aria-label="next">
                                {theme.direction === 'rtl' ? <SkipPreviousIcon /> : <SkipNextIcon />}
                            </IconButton>
                        </Box> */}
            </Box>
        </Card>
    );
};