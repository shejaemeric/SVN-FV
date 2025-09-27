import jsPDF from 'jspdf';

// Generate receipt PDF for 57mm thermal paper
export const generateReceiptPDF = (receiptData) => {
  console.log('Generating PDF with data:', receiptData);
  
  const mmToPt = 2.834645669;
  const paperWidth = 57 * mmToPt; // 161.57 points
  let paperHeight = 400; // Start with a large height

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [paperWidth, paperHeight],
  });

  let y = 20;
  console.log('Starting y position:', y);

  // === Helpers ===
  const centerText = (text, fontSize = 8, fontStyle = 'normal') => {
    console.log(`Center text: "${text}" at y=${y}, fontSize=${fontSize}`);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.text(text, paperWidth / 2, y, { align: 'center' });
    y += fontSize + 8;
    console.log(`After center text, y=${y}`);
  };

  const drawSeparator = () => {
    console.log(`Drawing separator at y=${y}`);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('*********************************************************', paperWidth / 2, y, { align: 'center' });
    y += 7 + 2;
    console.log(`After separator, y=${y}`);
  };

  const leftRightText = (left, right, fontSize = 8, bold = false) => {
    console.log(`LeftRight text: "${left}" | "${right}" at y=${y}, fontSize=${fontSize}`);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(left, 10, y);
    doc.text(right, paperWidth - 10, y, { align: 'right' });
    y += fontSize + 14;
    console.log(`After leftRight text, y=${y}`);
  };

  // === Header ===
  centerText('YOUR COMPANY NAME', 12, 'bold');
  centerText('Address: Your Address, 123-45', 7);
  centerText('Telp. +250 XXX XXX XXX', 7);
  drawSeparator();
  centerText('CASH RECEIPT', 8, 'bold');
  drawSeparator();

  // === Receipt Details ===
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  leftRightText('Date', currentDate, 8);

  // Customer info (if available)
  if (receiptData.customer) {
    leftRightText('Customer', receiptData.customer.name || 'N/A', 8);
    if (receiptData.customer.phone) {
      leftRightText('Phone', receiptData.customer.phone, 8);
    }
  }

  // Payment status
  if (receiptData.notPaidFull) {
    leftRightText('Payment Status', 'Partial Payment', 8);
    leftRightText('Amount Paid', `RWF ${receiptData.amountPaid?.toFixed(0) || '0'}`, 8);
    leftRightText('Amount Remaining', `RWF ${receiptData.remaining?.toFixed(0) || '0'}`, 8);
  } else {
    leftRightText('Payment Status', 'Full Payment', 8);
    leftRightText('Amount Paid', `RWF ${receiptData.amountPaid?.toFixed(0) || '0'}`, 8);
  }

  drawSeparator();

  // === Items Header ===
  leftRightText('Description', 'Price', 8, true);

  // === Items ===
  const items = Array.isArray(receiptData.items) ? receiptData.items : [];
  console.log('Items to display:', items);

  if (items.length === 0) {
    centerText('No items', 8);
  } else {
    items.forEach((item, index) => {
      console.log(`Processing item ${index}:`, item);
      const name = item?.name ?? '';
      const quantity = item?.quantity ?? item?.qty ?? 1;
      
      // Handle different price formats - prioritize numeric values
      let unitPrice = 0;
      let totalPrice = 0;
      
      if (typeof item?.unitPrice === 'number') {
        unitPrice = item.unitPrice;
        totalPrice = unitPrice * quantity;
      } else if (typeof item?.unit === 'string') {
        unitPrice = parseFloat(item.unit.replace(/[^\d.]/g, '')) || 0;
        totalPrice = unitPrice * quantity;
      } else if (typeof item?.unit === 'number') {
        unitPrice = item.unit;
        totalPrice = unitPrice * quantity;
      }
      
      // If total is provided directly, use it
      if (typeof item?.total === 'number') {
        totalPrice = item.total;
      } else if (typeof item?.total === 'string') {
        totalPrice = parseFloat(item.total.replace(/[^\d.]/g, '')) || totalPrice;
      }
      
      console.log(`Item ${index} prices:`, { unitPrice, totalPrice, quantity });
      
      // Show item name with quantity
      const itemDescription = `${name} x${quantity}`;
      leftRightText(itemDescription, `RWF ${totalPrice.toFixed(0)}`, 8);
    });
  }

  drawSeparator();

  // === Totals ===
  // Handle different data formats for totals
  let subtotal = 0;
  let taxes = 0;
  let total = 0;
  let amountPaid = 0;
  let remaining = 0;
  
  if (typeof receiptData.subtotal === 'number') {
    subtotal = receiptData.subtotal;
  } else if (typeof receiptData.subtotal === 'string') {
    subtotal = parseFloat(receiptData.subtotal.replace(/[^\d.]/g, '')) || 0;
  }
  
  if (typeof receiptData.taxes === 'number') {
    taxes = receiptData.taxes;
  } else if (typeof receiptData.taxes === 'string') {
    taxes = parseFloat(receiptData.taxes.replace(/[^\d.]/g, '')) || 0;
  }
  
  if (typeof receiptData.total === 'number') {
    total = receiptData.total;
  } else if (typeof receiptData.total === 'string') {
    total = parseFloat(receiptData.total.replace(/[^\d.]/g, '')) || 0;
  }
  
  if (typeof receiptData.amountPaid === 'number') {
    amountPaid = receiptData.amountPaid;
  } else if (typeof receiptData.amountPaid === 'string') {
    amountPaid = parseFloat(receiptData.amountPaid.replace(/[^\d.]/g, '')) || total;
  } else {
    amountPaid = total;
  }
  
  if (typeof receiptData.remaining === 'number') {
    remaining = receiptData.remaining;
  } else if (typeof receiptData.remaining === 'string') {
    remaining = parseFloat(receiptData.remaining.replace(/[^\d.]/g, '')) || 0;
  }
  
  const change = receiptData.notPaidFull ? remaining : (amountPaid - total);
  
  console.log('Receipt totals:', { subtotal, taxes, total, amountPaid, remaining, change });

  leftRightText('Subtotal', `RWF ${subtotal.toFixed(0)}`, 8, true);
  leftRightText('Tax (18%)', `RWF ${taxes.toFixed(0)}`, 8);
  
  leftRightText('Total', `RWF ${total.toFixed(0)}`, 10, true);
  leftRightText('Amount Paid', `RWF ${amountPaid.toFixed(0)}`, 8);
  
  if (receiptData.notPaidFull) {
    leftRightText('Remaining', `RWF ${remaining.toFixed(0)}`, 8);
  } else {
    leftRightText('Change', `RWF ${change.toFixed(0)}`, 8);
  }

  drawSeparator();

  leftRightText('ID: ', receiptData.id || 'N/A', 7);

  // === Footer ===
  centerText('THANK YOU!', 9, 'bold');
  y += 4;


  console.log('Final y position:', y);
  console.log('Paper dimensions:', { width: paperWidth, height: paperHeight });

  return doc;
};

// Download receipt as PDF
export const downloadReceiptPDF = (receiptData) => {
  try {
    console.log('Downloading PDF with data:', receiptData);
    const doc = generateReceiptPDF(receiptData);
    const fileName = `receipt_${receiptData.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create blob and open in new tab
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const newWindow = window.open(pdfUrl, '_blank');
    
    if (newWindow) {
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      return { success: true, message: 'Receipt opened in new tab' };
    } else {
      // Fallback to download if popup blocked
      doc.save(fileName);
      return { success: true, message: 'Receipt downloaded successfully' };
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, message: 'Failed to generate PDF: ' + error.message };
  }
};

// Print receipt
export const printReceipt = (receiptData) => {
  try {
    console.log('Printing PDF with data:', receiptData);
    const doc = generateReceiptPDF(receiptData);
    doc.autoPrint();
    
    // Create a blob and open in new window for printing
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        // Clean up the URL after printing
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      };
    } else {
      // Fallback: download if popup blocked
      downloadReceiptPDF(receiptData);
    }
    
    return { success: true, message: 'Receipt sent to printer' };
  } catch (error) {
    console.error('Error printing receipt:', error);
    return { success: false, message: 'Failed to print receipt: ' + error.message };
  }
};

// Generate summary report PDF for multiple receipts
export const generateReceiptsSummaryPDF = (receipts, summaryStats) => {
  console.log('Generating summary PDF with data:', { receipts, summaryStats });
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  let y = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // === Helpers ===
  const centerText = (text, fontSize = 12, fontStyle = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += fontSize + 8;
  };

  const leftText = (text, fontSize = 10, fontStyle = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.text(text, margin, y);
    y += fontSize + 4;
  };


  const drawLine = () => {
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
  };

  const drawTableHeader = (headers) => {
    const colWidths = [80, 100, 80, 60, 60, 80];
    let x = margin;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      doc.text(header, x, y);
      x += colWidths[index];
    });
    
    y += 15;
    drawLine();
  };

  const drawTableRow = (rowData) => {
    const colWidths = [80, 100, 80, 60, 60, 80];
    let x = margin;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    rowData.forEach((cell, index) => {
      doc.text(cell, x, y);
      x += colWidths[index];
    });
    
    y += 12;
  };

  // === Header ===
  centerText('SALES REPORT', 16, 'bold');
  centerText('Receipts Summary', 12);
  centerText(`Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 10);
  
  y += 20;

  // === Summary Statistics ===
  leftText('SUMMARY STATISTICS', 12, 'bold');
  y += 5;
  
  leftText(`Total Sales: ${summaryStats.totalSales}`, 10);
  leftText(`Total Transactions: ${summaryStats.totalTransactions}`, 10);
  leftText(`Average Order Value: ${summaryStats.averageOrder}`, 10);
  leftText(`Cash Sales: ${summaryStats.cashSales}`, 10);
  leftText(`Customer Sales: ${summaryStats.customerSales}`, 10);
  
  y += 20;

  // === Receipts Table ===
  leftText('RECEIPTS DETAILS', 12, 'bold');
  y += 10;

  // Table headers
  drawTableHeader(['Date', 'Receipt ID', 'Total', 'Items', 'Customer', 'Payment Status']);
  
  // Table rows
  receipts.forEach((receipt) => {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 40;
    }
    
    const customerType = receipt.customer_id ? 'Customer' : 'Cash';
    const itemsText = `${receipt.items.length} item${receipt.items.length !== 1 ? 's' : ''}`;
    const paymentStatus = receipt.notPaidFull ? 'Partial' : 'Full';
    
    drawTableRow([
      receipt.date,
      `#${receipt.invoice.substring(0, 8)}...`,
      receipt.total,
      itemsText,
      customerType,
      paymentStatus
    ]);
  });

  // Add detailed sales information section
  y += 20;
  leftText('DETAILED SALES INFORMATION', 12, 'bold');
  y += 10;

  receipts.forEach((receipt, index) => {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 100) {
      doc.addPage();
      y = 40;
    }

    // Receipt header
    leftText(`Receipt #${receipt.invoice} - ${receipt.date} ${receipt.time}`, 10, 'bold');
    y += 5;
    
    const customerType = receipt.customer_id ? 'Customer Order' : 'Cash Sale';
    const paymentStatus = receipt.notPaidFull ? 'Partial Payment' : 'Full Payment';
    const amountPaid = receipt.notPaidFull ? receipt.amountPaid : receipt.total;
    const amountRemaining = receipt.notPaidFull ? receipt.remaining : 0;
    
    leftText(`Customer Type: ${customerType}`, 9);
    leftText(`Payment Status: ${paymentStatus}`, 9);
    leftText(`Total Amount: ${receipt.total}`, 9);
    leftText(`Amount Paid: ${amountPaid}`, 9);
    if (receipt.notPaidFull) {
      leftText(`Amount Remaining: ${amountRemaining}`, 9);
    }
    
    y += 5;
    
    // Items details
    leftText('Items:', 9, 'bold');
    receipt.items.forEach((item) => {
      leftText(`  • ${item.name} - Qty: ${item.qty}, Unit Price: ${item.unit}, Total: ${item.total}`, 8);
    });
    
    y += 10;
    
    // Add separator between receipts
    if (index < receipts.length - 1) {
      drawLine();
    }
  });

  // === Footer ===
  y += 20;
  centerText('End of Report', 10);
  centerText('Thank you for using our system', 8);

  return doc;
};

// Download receipts summary as PDF
export const downloadReceiptsSummaryPDF = (receipts, summaryStats) => {
  try {
    console.log('Downloading summary PDF with data:', { receipts, summaryStats });
    const doc = generateReceiptsSummaryPDF(receipts, summaryStats);
    const fileName = `receipts_summary_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create blob and open in new tab
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const newWindow = window.open(pdfUrl, '_blank');
    
    if (newWindow) {
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      return { success: true, message: 'Receipts summary opened in new tab' };
    } else {
      // Fallback to download if popup blocked
      doc.save(fileName);
      return { success: true, message: 'Receipts summary downloaded successfully' };
    }
  } catch (error) {
    console.error('Error generating summary PDF:', error);
    return { success: false, message: 'Failed to generate summary PDF: ' + error.message };
  }
};

// Generate CSV content for receipts export
export const generateReceiptsCSV = (receipts, summaryStats) => {
  console.log('Generating CSV with data:', { receipts, summaryStats });
  
  // CSV Headers
  const headers = [
    'Receipt ID',
    'Date',
    'Time',
    'Customer Type',
    'Total Amount',
    'Items Count',
    'Item Details',
    'Payment Status',
    'Amount Paid',
    'Amount Remaining'
  ];
  
  // Convert receipts to CSV rows
  const csvRows = receipts.map(receipt => {
    const customerType = receipt.customer_id ? 'Customer' : 'Cash';
    const paymentStatus = receipt.notPaidFull ? 'Partial' : 'Full';
    const amountPaid = receipt.notPaidFull ? receipt.amountPaid : receipt.total;
    const amountRemaining = receipt.notPaidFull ? receipt.remaining : 0;
    
    // Create item details string
    const itemDetails = receipt.items.map(item => 
      `${item.name} (Qty: ${item.qty}, Price: ${item.unit})`
    ).join('; ');
    
    return [
      receipt.invoice,
      receipt.date,
      receipt.time,
      customerType,
      receipt.total,
      receipt.items.length,
      `"${itemDetails}"`, // Wrap in quotes to handle semicolons
      paymentStatus,
      amountPaid,
      amountRemaining
    ];
  });
  
  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => row.join(','))
    .join('\n');
  
  return csvContent;
};

// Download receipts as CSV
export const downloadReceiptsCSV = (receipts, summaryStats) => {
  try {
    console.log('Downloading CSV with data:', { receipts, summaryStats });
    const csvContent = generateReceiptsCSV(receipts, summaryStats);
    const fileName = `receipts_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return { success: true, message: 'CSV file downloaded successfully' };
    } else {
      return { success: false, message: 'CSV download not supported in this browser' };
    }
  } catch (error) {
    console.error('Error generating CSV:', error);
    return { success: false, message: 'Failed to generate CSV: ' + error.message };
  }
};

// Generate dashboard PDF report
export const generateDashboardPDF = (dashboardData) => {
  console.log('Generating dashboard PDF with data:', dashboardData);
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  let y = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // === Helpers ===
  const centerText = (text, fontSize = 12, fontStyle = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
    y += fontSize + 8;
  };

  const leftText = (text, fontSize = 10, fontStyle = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.text(text, margin, y);
    y += fontSize + 4;
  };

  const drawChart = (title, data, type = 'bar') => {
    leftText(title, 12, 'bold');
    y += 5;
    
    // Create a simple chart representation using text and lines
    const chartWidth = pageWidth - 2 * margin;
    const chartHeight = 100;
    const chartX = margin;
    const chartY = y;
    
    // Draw chart border
    doc.setLineWidth(1);
    doc.line(chartX, chartY, chartX + chartWidth, chartY); // Top
    doc.line(chartX, chartY, chartX, chartY + chartHeight); // Left
    doc.line(chartX + chartWidth, chartY, chartX + chartWidth, chartY + chartHeight); // Right
    doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight); // Bottom
    
    if (type === 'bar') {
      // Draw bar chart representation
      const barWidth = chartWidth / data.length;
      const maxValue = Math.max(...data.map(d => d.value || d.y || d));
      
      data.forEach((item, index) => {
        const value = item.value || item.y || item;
        const label = item.name || item.label || `Item ${index + 1}`;
        const barHeight = Math.max(10, (value / maxValue) * (chartHeight - 30));
        const barX = chartX + (index * barWidth) + 5;
        const barY = chartY + chartHeight - barHeight - 15;
        
        // Draw bar using lines
        doc.setLineWidth(2);
        doc.line(barX, barY, barX + barWidth - 10, barY); // Top of bar
        doc.line(barX, barY, barX, barY + barHeight); // Left of bar
        doc.line(barX + barWidth - 10, barY, barX + barWidth - 10, barY + barHeight); // Right of bar
        doc.line(barX, barY + barHeight, barX + barWidth - 10, barY + barHeight); // Bottom of bar
        
        // Draw label
        doc.setFontSize(8);
        doc.text(label, barX + (barWidth - 10) / 2, chartY + chartHeight - 5, { align: 'center' });
        doc.text(value.toString(), barX + (barWidth - 10) / 2, barY - 5, { align: 'center' });
      });
    } else if (type === 'pie') {
      // Draw pie chart representation using text
      const centerX = chartX + chartWidth / 2;
      const centerY = chartY + chartHeight / 2;
      
      data.forEach((item, index) => {
        const value = item.value || item.y || item;
        const label = item.name || item.label || `Item ${index + 1}`;
        const total = data.reduce((sum, d) => sum + (d.value || d.y || d), 0);
        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
        
        // Draw label and percentage
        doc.setFontSize(9);
        doc.text(`${label}: ${value} (${percentage}%)`, centerX - 50, centerY + (index * 15), { align: 'left' });
      });
    }
    
    y += chartHeight + 20;
  };

  // === Header ===
  centerText('DASHBOARD REPORT', 16, 'bold');
  centerText('Business Overview & Analytics', 12);
  centerText(`Generated on ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 10);
  
  y += 20;

  // === Summary Statistics ===
  leftText('BUSINESS SUMMARY', 12, 'bold');
  y += 5;
  
  leftText(`Total Products: ${dashboardData.totalProducts}`, 10);
  leftText(`Items Low in Stock: ${dashboardData.lowStockItems}`, 10);
  leftText(`Total Sales: RWF ${dashboardData.totalSales}`, 10);
  leftText(`Total Transactions: ${dashboardData.totalTransactions}`, 10);
  leftText(`Average Order Value: RWF ${dashboardData.averageOrderValue.toFixed(0)}`, 10);
  leftText(`Cash Sales: RWF ${dashboardData.cashSales}`, 10);
  leftText(`Customer Sales: RWF ${dashboardData.customerSales}`, 10);
  
  y += 20;

  // === Stock Analysis ===
  leftText('STOCK ANALYSIS', 12, 'bold');
  y += 5;
  
  const stockAnalysisData = dashboardData.products.reduce((acc, product) => {
    const stock = product.stock || 0;
    if (stock === 0) {
      acc.outOfStock++;
    } else if (stock <= 5) {
      acc.lowStock++;
    } else {
      acc.inStock++;
    }
    return acc;
  }, { inStock: 0, lowStock: 0, outOfStock: 0 });

  leftText(`Products In Stock: ${stockAnalysisData.inStock}`, 10);
  leftText(`Products Low in Stock: ${stockAnalysisData.lowStock}`, 10);
  leftText(`Products Out of Stock: ${stockAnalysisData.outOfStock}`, 10);
  
  y += 20;

  // === Monthly Sales Chart ===
  const salesData = dashboardData.receipts.reduce((acc, receipt) => {
    const total = receipt.total || 0;
    
    // Try to get date from different possible fields
    const dateString = receipt.created_at || receipt.date || receipt.timestamp || receipt.created_date;
    
    if (dateString) {
      try {
        const date = new Date(dateString);
        const monthIndex = date.getMonth(); // 0-11 for Jan-Dec
        
        // Only process if it's a valid date and within current year
        if (!isNaN(date.getTime()) && date.getFullYear() === new Date().getFullYear()) {
          acc[monthIndex] = (acc[monthIndex] || 0) + total;
        }
      } catch (error) {
        console.warn('Invalid date format in receipt:', dateString, error);
      }
    }
    
    return acc;
  }, new Array(12).fill(0));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlySalesChartData = months.map((month, index) => ({
    name: month,
    value: salesData[index] || 0
  }));
  
  drawChart('MONTHLY SALES BREAKDOWN', monthlySalesChartData, 'bar');
  
  // === Stock Distribution Chart ===
  const stockDistributionData = dashboardData.products.reduce((acc, product) => {
    const stock = product.stock || 0;
    if (stock === 0) {
      acc.outOfStock++;
    } else if (stock <= 5) {
      acc.lowStock++;
    } else {
      acc.inStock++;
    }
    return acc;
  }, { inStock: 0, lowStock: 0, outOfStock: 0 });

  const stockChartData = [
    { name: 'In Stock', value: stockDistributionData.inStock },
    { name: 'Low Stock', value: stockDistributionData.lowStock },
    { name: 'Out of Stock', value: stockDistributionData.outOfStock }
  ];
  
  drawChart('STOCK DISTRIBUTION', stockChartData, 'pie');

  // === Top Selling Products Chart ===
  const productSales = {};
  dashboardData.receipts.forEach(receipt => {
    if (receipt.sales) {
      receipt.sales.forEach(sale => {
        const productName = sale.product_name || 'Unknown Product';
        if (!productSales[productName]) {
          productSales[productName] = 0;
        }
        productSales[productName] += sale.number || 0;
      });
    }
  });

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5); // Top 5 for better chart display

  const topProductsChartData = topProducts.map(([productName, sales]) => ({
    name: productName.length > 15 ? productName.substring(0, 15) + '...' : productName,
    value: sales
  }));
  
  drawChart('TOP SELLING PRODUCTS', topProductsChartData, 'bar');

  // === Recent Activity ===
  leftText('RECENT ACTIVITY', 12, 'bold');
  y += 5;
  
  if (dashboardData.recentActivity && Array.isArray(dashboardData.recentActivity)) {
    dashboardData.recentActivity.forEach((activity, index) => {
      leftText(`${index + 1}. ${activity.title} - ${activity.description}`, 9);
    });
  } else {
    leftText('No recent activity data available', 9);
  }

  // === Footer ===
  y += 20;
  centerText('End of Dashboard Report', 10);
  centerText('Thank you for using our system', 8);

  return doc;
};

// Download dashboard as PDF
export const downloadDashboardPDF = (dashboardData) => {
  try {
    console.log('Downloading dashboard PDF with data:', dashboardData);
    const doc = generateDashboardPDF(dashboardData);
    const fileName = `dashboard_report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create blob and open in new tab
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const newWindow = window.open(pdfUrl, '_blank');
    
    if (newWindow) {
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      return { success: true, message: 'Dashboard report opened in new tab' };
    } else {
      // Fallback to download if popup blocked
      doc.save(fileName);
      return { success: true, message: 'Dashboard report downloaded successfully' };
    }
  } catch (error) {
    console.error('Error generating dashboard PDF:', error);
    return { success: false, message: 'Failed to generate dashboard PDF: ' + error.message };
  }
}; 