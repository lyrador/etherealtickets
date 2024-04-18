import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const oneEth = 1000000000000000000;
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
            <StyledTableCell>My Balance</StyledTableCell>
            <StyledTableCell align="right">{`ETH ${data.balanceEth.toFixed(18)}`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Individual Ticket Cost</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${ (data.ticketCostWei / oneEth).toFixed(18) }`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Number of Tickets</StyledTableCell>
            <StyledTableCell align="right">{`${data.numberOfTickets}`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Total Cost of Tickets</StyledTableCell>
            <StyledTableCell align="right">{`${data.currency} ${ (data.totalCostOfTicketsWei / oneEth).toFixed(18) }`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Commission Fee</StyledTableCell>
            <StyledTableCell align="right">{`ETH ${ (data.commissionFeeWei / oneEth).toFixed(18) }`}</StyledTableCell>
          </TableRow>
          {/* <TableRow>
            <StyledTableCell>Final Amount to Pay</StyledTableCell>
            <StyledTableCell align="right">{`Estimated: ${data.currency} ${ (data.finalAmountToPayWei / oneEth).toFixed(18) }`}</StyledTableCell>
          </TableRow>
          <TableRow>
            <StyledTableCell>Final Balance</StyledTableCell>
            <StyledTableCell align="right">{`Estimated: ${data.currency} ${ data.finalBalance.toString() }`}</StyledTableCell>
          </TableRow> */}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default FinancialTable;