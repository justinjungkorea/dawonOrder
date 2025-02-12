import React, { useState, useEffect } from "react";
import {
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
} from "@mui/material";

const REACT_APP_SHEET_ID = process.env.REACT_APP_SHEET_ID;
const REACT_APP_API_KEY = process.env.REACT_APP_API_KEY;
const REACT_APP_SHEET_NAME = process.env.REACT_APP_SHEET_NAME;
const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${REACT_APP_SHEET_ID}/values/${REACT_APP_SHEET_NAME}?key=${REACT_APP_API_KEY}`;

const formatDateHeader = (date) => `${date.getDate()}일(${date.toLocaleDateString("ko-KR", { weekday: "short" })})`;

const parseDeliveryDate = (dateValue) => {
  if (!dateValue) return { display: "-", raw: null };
  const formattedDate = dateValue.replace(/\./g, "/").trim();
  const date = new Date(formattedDate);
  if (isNaN(date.getTime())) return { display: "-", raw: null };
  return {
    display: `${date.getDate()}일(${date.toLocaleDateString("ko-KR", { weekday: "short" })})`,
    raw: date,
  };
};

const getDateRange = (filter) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);
  const startOfNextWeek = new Date(startOfWeek);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
  const endOfNextWeek = new Date(startOfNextWeek);
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 5);
  const formatDate = (date) => `${date.getDate()}일(${date.toLocaleDateString("ko-KR", { weekday: "short" })})`;

  switch (filter) {
    case "all":
      return [];
    case "today":
      return [formatDate(today)];
    case "tomorrow":
      return [formatDate(tomorrow)];
    case "thisWeek":
      return Array.from({ length: 6 }, (_, i) => formatDate(new Date(startOfWeek.getTime() + i * 86400000)));
    case "nextWeek":
      return Array.from({ length: 6 }, (_, i) => formatDate(new Date(startOfNextWeek.getTime() + i * 86400000)));
    default:
      return [];
  }
};

const OrderList = () => {
  const [filter, setFilter] = useState(() => {
  const currentHour = new Date().getHours();
  return currentHour < 16 ? "today" : "tomorrow";
});
  const [sortAsc, setSortAsc] = useState(false);
  const [orders, setOrders] = useState([]);
  const todayFormatted = formatDateHeader(new Date());

  useEffect(() => {
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
              deliveryDate: parsedDate.display,
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
    fetchOrders();
  }, []);

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => getDateRange(filter).includes(order.deliveryDate));

  const sortedOrders = [...filteredOrders].sort((a, b) => (sortAsc ? a.rawDate - b.rawDate : b.rawDate - a.rawDate));

  return (
    <Container maxWidth="sm" sx={{ mt: 2, paddingBottom: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <Box sx={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { label: "오늘", value: "today" },
            { label: "내일", value: "tomorrow" },
            { label: "이번 주", value: "thisWeek" },
            { label: "다음 주", value: "nextWeek" },
          ].map((btn) => (
            <Button
              key={btn.value}
              variant={filter === btn.value ? "contained" : "outlined"}
              onClick={() => setFilter(btn.value)}
              sx={{ minWidth: "60px", fontSize: "11px", padding: "4px 8px" }}
            >
              {btn.label}
            </Button>
          ))}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontSize: "14px" }}>
          {todayFormatted}
        </Typography>
      </Box>
      <TableContainer component={Paper} sx={{ maxWidth: "100%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: "12px", width: "25%" }}>업체명</TableCell>
              <TableCell sx={{ fontSize: "12px", width: "35%" }}>발주 내용</TableCell>
              <TableCell sx={{ fontSize: "12px", width: "30%", cursor: "pointer" }}
                onClick={() => setSortAsc(!sortAsc)}>
                배송일 {sortAsc ? "▲" : "▼"}
              </TableCell>
              <TableCell sx={{ fontSize: "12px", width: "10%" }}>비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell sx={{ fontSize: "11px" }}>{order.company}</TableCell>
                <TableCell sx={{ fontSize: "11px" }}>{order.content}</TableCell>
                <TableCell sx={{ fontSize: "11px" }}>{order.deliveryDate}</TableCell>
                <TableCell sx={{ fontSize: "11px" }}>{order.remark}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default OrderList;
