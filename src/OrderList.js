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
  return isNaN(date.getTime())
    ? { display: "-", raw: null }
    : { display: `${date.getDate()}일(${date.toLocaleDateString("ko-KR", { weekday: "short" })})`, raw: date };
};

const getDateRange = (filter) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const startOfNextWeek = new Date(startOfWeek);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
  const formatDate = (date) => `${date.getDate()}일(${date.toLocaleDateString("ko-KR", { weekday: "short" })})`;

  switch (filter) {
    case "today": return [formatDate(today)];
    case "tomorrow": return [formatDate(tomorrow)];
    case "thisWeek": return Array.from({ length: 6 }, (_, i) => formatDate(new Date(startOfWeek.getTime() + i * 86400000)));
    case "nextWeek": return Array.from({ length: 6 }, (_, i) => formatDate(new Date(startOfNextWeek.getTime() + i * 86400000)));
    default: return [];
  }
};

const formatContent = (content) => content.split(",").map((item, index) => <div key={index}>-{item.trim()}</div>);

const OrderList = () => {
  const [filter, setFilter] = useState(() => (new Date().getHours() < 16 ? "today" : "tomorrow"));
  const [sortAsc, setSortAsc] = useState(false);
  const [orders, setOrders] = useState([]);
  const todayFormatted = formatDateHeader(new Date());

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
        setOrders((prevOrders) => {
          const updatedOrders = formattedOrders.filter((newOrder) => {
            const existingOrder = prevOrders.find((order) => order.id === newOrder.id);
            return (
              !existingOrder ||
              existingOrder.company !== newOrder.company ||
              existingOrder.content !== newOrder.content ||
              existingOrder.deliveryDate !== newOrder.deliveryDate ||
              existingOrder.remark !== newOrder.remark
            );
          });
          return updatedOrders.length > 0 ? formattedOrders : prevOrders;
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const filteredOrders = orders.filter((order) => getDateRange(filter).includes(order.deliveryDate));
  const sortedOrders = [...filteredOrders].sort((a, b) => (sortAsc ? a.rawDate - b.rawDate : b.rawDate - a.rawDate));

  return (
    <Container maxWidth="sm" sx={{ mt: 2, paddingBottom: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <Box sx={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["today", "tomorrow", "thisWeek", "nextWeek"].map((value) => (
            <Button
              key={value}
              variant={filter === value ? "contained" : "outlined"}
              onClick={() => setFilter(value)}
              sx={{ minWidth: "60px", fontSize: "11px", padding: "4px 8px" }}
            >
              {value === "today" ? "오늘" : value === "tomorrow" ? "내일" : value === "thisWeek" ? "이번 주" : "다음 주"}
            </Button>
          ))}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontSize: "14px" }}>{todayFormatted}</Typography>
      </Box>
      <TableContainer component={Paper} sx={{ maxWidth: "100%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: "12px", fontWeight: "bold", width: "25%" }}>업체명</TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: "bold", width: "30%" }}>발주 내용</TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: "bold", width: "25%", cursor: "pointer" }}
                onClick={() => setSortAsc(!sortAsc)}>
                배송일 {sortAsc ? "▲" : "▼"}
              </TableCell>
              <TableCell sx={{ fontSize: "12px", fontWeight: "bold",width: "20%" }}>비고</TableCell>
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
  );
};

export default OrderList;
