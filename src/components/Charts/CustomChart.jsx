import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { ResponsiveChartContainer } from '@mui/x-charts/ResponsiveChartContainer';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import { BarPlot } from '@mui/x-charts/BarChart';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { ChartsGrid } from '@mui/x-charts/ChartsGrid';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import RobotoFont from '../../assets/font/themify-icons/fonts/Roboto-Regular.ttf';
import Button from '@mui/material/Button';
// import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';
import './CustomChart.css';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import axios from 'axios';
import axiosInstance from '../../utils/axiosConfig';
import robotoRegular from '../../assets/font/Roboto-Regular-normal';
import robotoBold from '../../assets/font/Roboto-Bold-bold'

const monthData = {
  'Tháng 1': 31,
  'Tháng 2': (year) => (isLeapYear(year) ? 29 : 28),
  'Tháng 3': 31,
  'Tháng 4': 30,
  'Tháng 5': 31,
  'Tháng 6': 30,
  'Tháng 7': 31,
  'Tháng 8': 31,
  'Tháng 9': 30,
  'Tháng 10': 31,
  'Tháng 11': 30,
  'Tháng 12': 31,
};

const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const dataset = (labels, shipmentCounts, paymentAmounts, labelType) => {
  if (!Array.isArray(labels)) {
    console.error('labels is not an array:', labels);
    return [];
  }

  return labels.map((label, index) => ({
    [labelType]: label,
    precip: paymentAmounts[index] || 0,
    max: shipmentCounts[index] || 0,
  }));
};


const series = [
  { type: 'line', dataKey: 'max', color: '#fe5f55' },
  { type: 'bar', dataKey: 'precip', color: '#bfdbf7', yAxisId: 'rightAxis' },
];

export default function CustomChart() {
  const [reverseX, setReverseX] = React.useState(false);
  const [reverseLeft, setReverseLeft] = React.useState(false);
  const [reverseRight, setReverseRight] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState('Tháng 1');
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [data, setData] = React.useState([]);
  const [successfulShipments, setSuccessfulShipments] = React.useState([]);
  const [chartType, setChartType] = React.useState('daily');
  const [quarterlyData, setQuarterlyData] = React.useState([]);
  const [monthlyData, setMonthlyData] = React.useState([]);


  // Get Cookie by name
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };
  const fetchShipments = async (month, year) => {
    try {
      const token = getCookie('access_token');
      const daysInMonth = typeof monthData[month] === 'function' ? monthData[month](year) : monthData[month];

      const shipmentCounts = Array(daysInMonth).fill(0);
      const paymentAmounts = Array(daysInMonth).fill(0);
      let totalPages = 1;
      let currentPage = 1;

      while (currentPage <= totalPages) {
        const response = await axiosInstance.get('http://localhost:1010/api/shipment/view/listByStatus', {
          params: {
            page: currentPage,
            limit: 100,
            status: 'SUCCESS',
          },
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Dữ liệu shipment:', response.data);

      const shipments = response.data.listShipment;

      for (const shipment of shipments) {
        const date = new Date(shipment.dateCreated);
        if (date.getFullYear() === year && date.getMonth() + 1 === parseInt(month.split(' ')[1])) {
          const dayIndex = date.getDate() - 1;
          shipmentCounts[dayIndex]++;

          if (shipment.paymentId) {
            const paymentResponse = await axiosInstance.get(`http://localhost:1010/api/payment/view/${shipment.paymentId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            paymentAmounts[dayIndex] += paymentResponse.data.amount;
          }
        }
      }
      currentPage++;
    }
      setSuccessfulShipments(shipmentCounts);
      setData(dataset(Array.from({ length: daysInMonth }, (_, i) => i + 1), shipmentCounts, paymentAmounts, 'day'));
    } catch (error) {
      console.error('Error fetching shipments:', error);
    }
  };


  const handleMonthChange = (e) => setSelectedMonth(e.target.value);
  const handleYearChange = (e) => setSelectedYear(e.target.value);
  const handleChartTypeChange = (e) => setChartType(e.target.value);

  const fetchMonthlyData = async (year) => {
    try {
      const token = getCookie('access_token');
      const shipmentCounts = Array(12).fill(0);
      const paymentAmounts = Array(12).fill(0);
      let totalPages = 1;
      let currentPage = 1;
  
      while (currentPage <= totalPages) {
        const response = await axiosInstance.get('http://localhost:1010/api/shipment/view/listByStatus', {
          params: { page: currentPage, limit: 100, status: 'SUCCESS' },
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const shipments = response.data.listShipment;
  
        for (const shipment of shipments) {
          const date = new Date(shipment.dateCreated);
          if (date.getFullYear() === year) {
            const monthIndex = date.getMonth();
            shipmentCounts[monthIndex]++;
            
            if (shipment.paymentId) {
              const paymentResponse = await axiosInstance.get(`http://localhost:1010/api/payment/view/${shipment.paymentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              paymentAmounts[monthIndex] += paymentResponse.data.amount;
            }
          }
        }
        currentPage++;
      }
      setSuccessfulShipments(shipmentCounts);
      setMonthlyData(
        Array.from({ length: 12 }, (_, i) => ({
          month: `Tháng ${i + 1}`,
          orders: shipmentCounts[i],
          revenue: paymentAmounts[i],
        }))
      );
      setData(dataset(
        Object.keys(monthData),
        shipmentCounts,
        paymentAmounts,
        'month'
      ));
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };
  
  const fetchQuarterlyData = async (year) => {
    try {
      const token = getCookie('access_token');
      const shipmentCounts = Array(4).fill(0); // 4 quý
      const paymentAmounts = Array(4).fill(0);
      let totalPages = 1;
      let currentPage = 1;
  
      while (currentPage <= totalPages) {
        const response = await axiosInstance.get('http://localhost:1010/api/shipment/view/listByStatus', {
          params: { page: currentPage, limit: 100, status: 'SUCCESS' },
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const shipments = response.data.listShipment;
  
        for (const shipment of shipments) {
          const date = new Date(shipment.dateCreated);
          if (date.getFullYear() === year) {
            const quarterIndex = Math.floor(date.getMonth() / 3); // 0 -> Q1, 1 -> Q2, 2 -> Q3, 3 -> Q4
            shipmentCounts[quarterIndex]++;
            
            if (shipment.paymentId) {
              const paymentResponse = await axiosInstance.get(`http://localhost:1010/api/payment/view/${shipment.paymentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              paymentAmounts[quarterIndex] += paymentResponse.data.amount;
            }
          }
        }
        currentPage++;
      }
      setSuccessfulShipments(shipmentCounts);
      setQuarterlyData(
        ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'].map((quarter, i) => ({
          quarter,
          orders: shipmentCounts[i],
          revenue: paymentAmounts[i],
        }))
      );
      setData(dataset(
        ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'],
        shipmentCounts,
        paymentAmounts,
        'quarter'
      ));
    } catch (error) {
      console.error('Error fetching quarterly data:', error);
    }
  };
  
  React.useEffect(() => {
    if (chartType === 'daily') {
      fetchShipments(selectedMonth, selectedYear);
    } else if (chartType === 'monthly') {
      fetchMonthlyData(selectedYear);
    } else if (chartType === 'quarterly') {
      fetchQuarterlyData(selectedYear);
    }
  }, [selectedMonth, selectedYear, chartType]);
  

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      currency: 'VND',   // Đơn vị tiền tệ Việt Nam Đồng
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const handleExportPDF = async () => {
    const chartElement = document.querySelector('.custom-chart-container');
    if (!chartElement) {
      console.error('chartElement không tồn tại.');
      return;
    }
  
    try {
      const dataToUse = chartType === 'monthly' ? monthlyData : chartType === 'quarterly' ? quarterlyData : new Array(12).fill({ orders: 0, revenue: 0 });
  
      const dataUrl = await domtoimage.toPng(chartElement);
      const pdf = new jsPDF();
  
      pdf.setFont('Roboto-Bold', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor('#1d6587');
      pdf.text('Báo cáo thống kê doanh thu', 105, 20, { align: 'center' });
  
      pdf.setFont('Roboto-Regular', 'normal');
      pdf.setFontSize(12);
      if (chartType === 'daily') {
        pdf.text(`Tháng: ${selectedMonth}`, 20, 30);
        pdf.text(`Năm: ${selectedYear}`, 20, 40);
      } else {
        pdf.text(`Năm: ${selectedYear}`, 20, 30);
      }
  
      const imgWidth = 190;
      const imgHeight = (chartElement.offsetHeight * imgWidth) / chartElement.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', 10, 50, imgWidth, imgHeight);
  
      pdf.addPage();
      pdf.setFont('Roboto-Bold', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor('#1d6587');
      pdf.text('Dữ liệu chi tiết', 105, 20, { align: 'center' });
  
      let tableData = [];
      if (chartType === 'monthly') {
        tableData = Array.from({ length: 12 }, (_, i) => [
          i + 1,
          `Tháng ${i + 1}`,
          dataToUse[i]?.orders || 0,
          dataToUse[i]?.revenue ? `${formatPrice(dataToUse[i].revenue)} VND` : '',
        ]);
      } else if (chartType === 'monthly') {
        tableData = Array.from({ length: 4 }, (_, i) => [
          i + 1,
          `Quý ${i + 1}`,
          dataToUse[i]?.orders || 0,
          dataToUse[i]?.revenue ? `${formatPrice(dataToUse[i].revenue)} VND` : '',
        ]);
      } else if (chartType === 'daily') {
        const daysInMonth = typeof monthData[selectedMonth] === 'function'
          ? monthData[selectedMonth](selectedYear)
          : monthData[selectedMonth];
  
        const dates = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return `${day < 10 ? '0' + day : day}/${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}/${selectedYear}`;
        });
  
        tableData = dates.map((date, index) => [
          index + 1,
          date,
          successfulShipments[index] || 0,
          data[index]?.precip ? `${formatPrice(data[index].precip)} VND` : '',
        ]);
      }
  
      pdf.autoTable({
        head: [['STT', chartType === 'daily' ? 'Ngày' : (chartType === 'monthly' ? 'Tháng' : 'Quý'), 'Số đơn hàng', 'Doanh thu']],
        body: tableData,
        startY: 30,
        theme: 'striped',
        styles: {
          font: 'Roboto-Regular',
          fontSize: 10,
          textColor: '#333333',
          halign: 'center',
          valign: 'middle',
          lineColor: [44, 62, 80],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [230, 247, 255],
          textColor: '#333333',
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: '#333333',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [230, 247, 255],
        },
      });
  
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      });
  
      pdf.setFont('Roboto-Regular', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor('#555555');
      pdf.text(`Xuất báo cáo: ${formattedDate}`, 105, pdf.internal.pageSize.height - 20, { align: 'center' });
  
      if (chartType === 'daily') {
        pdf.save(`Bao_cao_${selectedMonth}_${selectedYear}.pdf`);
      } else if (chartType === 'monthly') {
        pdf.save(`Bao_cao_theo_thang_${selectedYear}.pdf`);
      } else if (chartType === 'quarterly') {
        pdf.save(`Bao_cao_theo_quy_${selectedYear}.pdf`);
      }
    } catch (error) {
      console.error('Lỗi khi xuất file PDF:', error);
    }
  };
  

  return (
    <Stack className="custom-chart" sx={{ width: '100%' }}>
      <div className="custom-chart-title">
        <Select value={chartType} onChange={handleChartTypeChange} sx={{ marginRight: 2 }}>
          <MenuItem value="daily">Biểu đồ doanh thu các ngày trong tháng</MenuItem>
          <MenuItem value="monthly">Biểu đồ doanh thu các tháng trong năm</MenuItem>
          <MenuItem value="quarterly">Biểu đồ doanh thu các quý trong năm</MenuItem>
        </Select>


        {chartType === 'daily' && (
          <>
            <Select value={selectedMonth} onChange={handleMonthChange} sx={{ marginLeft: 2 }}>
              {Object.keys(monthData).map((month) => (
                <MenuItem key={month} value={month}>{month}</MenuItem>
              ))}
            </Select>
            <Select value={selectedYear} onChange={handleYearChange} sx={{ marginLeft: 2 }}>
              {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index).map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </>
        )}

        {chartType === 'monthly' && (
          <Select value={selectedYear} onChange={handleYearChange} sx={{ marginLeft: 2 }}>
            {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index).map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        )}

        {chartType === 'quarterly' && (
          <Select value={selectedYear} onChange={handleYearChange} sx={{ marginLeft: 2 }}>
            {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index).map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        )}


        <Button sx={{ marginLeft: 2 }} onClick={handleExportPDF}>
          Xuất PDF
        </Button>
      </div>
      <Stack direction="row">
        <FormControlLabel
          checked={reverseX}
          control={
            <Checkbox onChange={(event) => setReverseX(event.target.checked)} />
          }
          label="Đảo ngược biểu đồ"
          labelPlacement="end"
        />
        <FormControlLabel
          checked={reverseLeft}
          control={
            <Checkbox onChange={(event) => setReverseLeft(event.target.checked)} />
          }
          label="Đảo ngược trái"
          labelPlacement="end"
        />
        <FormControlLabel
          checked={reverseRight}
          control={
            <Checkbox onChange={(event) => setReverseRight(event.target.checked)} />
          }
          label="Đảo ngược phải"
          labelPlacement="end"
        />
      </Stack>
      <Box className="custom-chart-container" sx={{ width: '950px' }} >
        <ResponsiveChartContainer
          series={series}
          xAxis={[{
            scaleType: 'band',
            dataKey: chartType === 'daily' ? 'day' : chartType === 'monthly' ? 'month' : 'quarter',
            label:
              chartType === 'daily'
                ? 'Các ngày trong tháng'
                : chartType === 'monthly'
                  ? 'Các tháng trong năm'
                  : 'Các quý trong năm',
            reverse: reverseX,
          }]}
          yAxis={[
            { id: 'leftAxis', reverse: reverseLeft },
            {
              id: 'rightAxis',
              reverse: reverseRight,
              tickFormatter: (value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}K`;
                }
                return value;
              }
            },
          ]}
          dataset={data}
          height={400}
        >

          <ChartsGrid horizontal />
          <BarPlot />
          <LinePlot />
          <MarkPlot />
          <ChartsXAxis />
          <ChartsYAxis axisId="leftAxis" />
          <ChartsYAxis axisId="rightAxis" position="right" />
          <ChartsTooltip />
        </ResponsiveChartContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-20px' }}>
          <h6 style={{ margin: 0 }}>Tổng đơn hàng </h6>
          <h6 style={{ margin: 0 }}>Tổng giá trị (VND)</h6>
        </div>
      </Box>
    </Stack>
  );
} 