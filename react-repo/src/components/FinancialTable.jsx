import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const StyledTableCell = ({ children, ...otherProps }) => (
  <TableCell {...otherProps}>
    <Typography variant="body2">{children}</Typography>
  </TableCell>
);

const FinancialTable = ({ data }) => {
  return (
    <TableContainer component={Paper} elevation={0} variant="outlined">
      <Table sx={{ minWidth: 650 }} aria-label="financial table">
        <TableHead>
          <TableRow>
            <StyledTableCell>Description</StyledTableCell>
            <StyledTableCell align="right">Amount</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <StyledTableCell>Balance</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${data.balance.toFixed(2)}`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Individual Ticket Cost</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${data.ticketCost.toFixed(2)}`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Total Cost of Tickets</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${data.totalCostOfTickets.toFixed(2)}`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Commission Fee</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${data.commissionFee.toFixed(2)}`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Final Amount to Pay</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${data.finalAmountToPay.toFixed(2)}`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Final Balance</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${data.finalBalance.toFixed(2)}`}</StyledTableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default FinancialTable;