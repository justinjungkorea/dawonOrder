import React, { useState, useEffect } from "react";
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from "@mui/material";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const REACT_APP_SHEET_ID = process.env.REACT_APP_SHEET_ID;
const REACT_APP_API_KEY = process.env.REACT_APP_API_KEY;
const REACT_APP_SHEET_NAME = process.env.REACT_APP_SHEET_NAME;
const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${REACT_APP_SHEET_ID}/values/${REACT_APP_SHEET_NAME}?key=${REACT_APP_API_KEY}`;

// 날짜 포맷을 "일(요일)" 형태로 변경
const formatDate = (date) => `${date.getDate()}일(${date.toLocaleDateString("ko-KR", { weekday: "short" })})`;

const parseDeliveryDate = (dateValue) => {
  if (!dateValue) return { display: "-", raw: null };
  const formattedDate = dateValue.replace(/\./g, "/").trim();
  const date = new Date(formattedDate);
  return isNaN(date.getTime()) ? { display: "-", raw: null } : { display: formatDate(date), raw: date };
};

const formatContent = (content) => content.split(",").map((item, index) => <div key={index}>{index + 1}) {item.trim()}</div>);

const OrderList = () => {
  const defaultDate = new Date();
  if (defaultDate.getHours() >= 16) {
    defaultDate.setDate(defaultDate.getDate() + 1);
  }
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [sortAsc, setSortAsc] = useState(false);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(SHEET_API_URL);
      const result = await response.json();
      if (result.values) {
        const formattedOrders = result.values.slice(1).map((row, index) => {
          const parsedDate = parseDeliveryDate(row[3]);
          return {
            id: index + 1,
            company: row[1] || "",
            content: row[4] || "",
            deliveryDate: parsedDate.display, // 기존 포맷 유지
            rawDate: parsedDate.raw,
            remark: row[5] || "",
          };
        });
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const filteredOrders = orders.filter(
    (order) => 
      order.rawDate && 
      order.rawDate.toDateString() === selectedDate.toDateString()
  );
  const sortedOrders = [...filteredOrders].sort((a, b) => (sortAsc ? a.rawDate - b.rawDate : b.rawDate - a.rawDate));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="sm" sx={{ mt: 2, paddingBottom: 2 }}>
        {/* MobileDatePicker 추가 */}
        <Box sx={{ display: "flex", justifyContent: "left", marginBottom: "3px" }}>
          <MobileDatePicker
            closeOnSelect={true}
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            onOpen={() => document.activeElement.blur()}
            onClose={() => document.activeElement.blur()}
            format="MM월 dd일"
            slotProps={{
              actionBar: { actions: [] },
              textField: {
                variant: "outlined",
                size: "small",
                sx: {
                  backgroundColor: "#f0f0f0",
                  borderRadius: "8px",
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: "#1976d2" },
                    '&:hover fieldset': { borderColor: "#115293" },
                    '&.Mui-focused fieldset': { borderColor: "#0d47a1" },
                  },
                },
              },
            }}
          />
        </Box>

        {/* 기존 TableContainer 스타일 유지 */}
        <TableContainer component={Paper} sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: "12px", fontWeight: "bold", width: "25%" }}>업체명</TableCell>
                <TableCell sx={{ fontSize: "12px", fontWeight: "bold", width: "30%" }}>발주 내용</TableCell>
                <TableCell
                  sx={{ fontSize: "12px", fontWeight: "bold", width: "25%", cursor: "pointer" }}
                  onClick={() => setSortAsc(!sortAsc)}
                >
                  배송일 {sortAsc ? "▲" : "▼"}
                </TableCell>
                <TableCell sx={{ fontSize: "12px", fontWeight: "bold", width: "20%" }}>비고</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell sx={{ fontSize: "11px" }}>{order.company}</TableCell>
                  <TableCell sx={{ fontSize: "11px" }}>{formatContent(order.content)}</TableCell>
                  <TableCell sx={{ fontSize: "11px" }}>{order.deliveryDate}</TableCell>
                  <TableCell sx={{ fontSize: "11px" }}>{order.remark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </LocalizationProvider>
  );
};

export default OrderList;
