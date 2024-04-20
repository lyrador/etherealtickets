import React from "react";

import { Alert, Snackbar } from '@mui/material';


function SnackbarAlert({openAlert, handleCloseAlert, alertType, alertMessage}) {
    const vertical = 'top';
    const horizontal = 'left';
    return (
        <>
            <Snackbar open={openAlert} autoHideDuration={5000} onClose={handleCloseAlert} anchorOrigin={{vertical, horizontal}} sx={{ zIndex: 99999 }}>
                <Alert onClose={handleCloseAlert} severity={alertType} variant="filled" sx={{ width: '100%' }}>
                    {alertMessage}
                </Alert>
            </Snackbar>
        </>
    );
}

export default SnackbarAlert;