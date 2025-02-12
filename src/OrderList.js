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
} from "@mui/material";
import dayjs from "dayjs";

const SHEET_URL = process.env.SHEET_URL;

const getDateRange = (filter) => {
  const today = dayjs();
  switch (filter) {
    case "today":
      return [today.format("YYYY-MM-DD")];
    case "tomorrow":
      return [today.add(1, "day").format("YYYY-MM-DD")];
    case "thisWeek":
      return Array.from({ length: 7 }, (_, i) => today.add(i, "day").format("YYYY-MM-DD"));
    case "nextWeek":
      return Array.from({ length: 7 }, (_, i) => today.add(i + 7, "day").format("YYYY-MM-DD"));
    default:
      return [];
  }
};

const OrderList = () => {
  const [filter, setFilter] = useState("today");
  const [sortAsc, setSortAsc] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => getDateRange(filter).includes(order.deliveryDate));
  const sortedOrders = [...filteredOrders].sort((a, b) =>
    sortAsc ? a.deliveryDate.localeCompare(b.deliveryDate) : b.deliveryDate.localeCompare(a.deliveryDate)
  );

  return (
    <Container maxWidth="md" sx={{ mt: 3 }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
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
          >
            {btn.label}
          </Button>
        ))}
      </div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>업체명</TableCell>
              <TableCell>발주 내용</TableCell>
              <TableCell
                style={{ cursor: "pointer" }}
                onClick={() => setSortAsc(!sortAsc)}
              >
                배송일 {sortAsc ? "▲" : "▼"}
              </TableCell>
              <TableCell>비고</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.company}</TableCell>
                <TableCell>{order.content}</TableCell>
                <TableCell>{order.deliveryDate}</TableCell>
                <TableCell>{order.remark}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default OrderList;
