import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportTableToPDF = (tableData, columns, title, filename) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table display
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // Brand blue color
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // Gray color
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Prepare data for the table
  const tableColumns = columns.map(col => ({
    title: col.header,
    dataKey: col.key,
    width: col.width || 'auto'
  }));
  
  const tableRows = tableData.map(row => {
    const tableRow = {};
    columns.forEach(col => {
      tableRow[col.key] = col.formatter ? col.formatter(row[col.key], row) : row[col.key] || '';
    });
    return tableRow;
  });
  
  // Generate the table
  autoTable(doc, {
    head: [tableColumns.map(col => col.title)],
    body: tableRows.map(row => tableColumns.map(col => row[col.dataKey])),
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left'
    },
    headStyles: {
      fillColor: [59, 130, 246], // Brand blue background
      textColor: [255, 255, 255], // White text
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // Light gray alternate rows
    },
    columnStyles: columns.reduce((styles, col, index) => {
      if (col.align) {
        styles[index] = { halign: col.align };
      }
      return styles;
    }, {}),
    didDrawPage: (data) => {
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageSize.width - 30,
        pageHeight - 10
      );
    }
  });
  
  // Save the PDF
  doc.save(filename);
};

export const exportDashboardToPDF = async (chartsData, title, filename) => {
  // Wait a moment for charts to fully render
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(title, 20, 30);
  
  // Add date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
  
  let currentY = 50;
  
  // Helper function to generate chart representation
  const generateChartRepresentation = (doc, chart, x, y, width, height) => {
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, width, height, 'FD');
    
    // Add chart border
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.rect(x, y, width, height);
    
    // Generate simple chart visualization based on chart type
    if (chart.type === 'area' || chart.type === 'bar') {
      // Generate bar chart representation
      const chartData = chart.data || [];
      const maxValue = Math.max(...chartData.map(d => d.total || d.value || 0));
      const barWidth = (width - 20) / Math.min(chartData.length, 12);
      
      chartData.slice(0, 12).forEach((item, index) => {
        const value = item.total || item.value || 0;
        const barHeight = maxValue > 0 ? (value / maxValue) * (height - 30) : 0;
        const barX = x + 10 + (index * barWidth);
        const barY = y + height - 15 - barHeight;
        
        // Draw bar
        doc.setFillColor(59, 130, 246);
        doc.rect(barX, barY, barWidth - 2, barHeight, 'F');
      });
    } else if (chart.type === 'pie') {
      // Generate pie chart representation
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radius = Math.min(width, height) / 4;
      
      doc.setFillColor(59, 130, 246);
      doc.circle(centerX, centerY, radius, 'F');
      
      doc.setFillColor(255, 255, 255);
      doc.circle(centerX, centerY, radius * 0.6, 'F');
    }
    
    // Add chart title
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`[${chart.title} Chart]`, x + width/2, y + height - 5, { align: 'center' });
  };
  
  // Helper function to wait for element to be ready
  const waitForElementReady = (element, timeout = 2000) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkReady = () => {
        if (element.offsetWidth > 0 && element.offsetHeight > 0) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
    });
  };

  // Helper function to capture chart screenshot
  const captureChartScreenshot = (chartElement, chartTitle) => {
    return new Promise(async (resolve) => {
      if (!chartElement) {
        resolve(null);
        return;
      }
      
      try {
        // Wait for element to be properly rendered
        const isReady = await waitForElementReady(chartElement);
        if (!isReady) {
          console.warn('Chart element not ready for capture:', chartTitle);
          resolve(null);
          return;
        }
        
        // Use html2canvas to capture the chart
        import('html2canvas').then(html2canvas => {
          html2canvas.default(chartElement, {
            backgroundColor: '#ffffff',
            scale: 1.5, // Balanced resolution to avoid distortion
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: chartElement.offsetWidth,
            height: chartElement.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            windowWidth: chartElement.offsetWidth,
            windowHeight: chartElement.offsetHeight
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            resolve({
              data: imgData,
              width: canvas.width,
              height: canvas.height
            });
          }).catch(error => {
            console.warn('Failed to capture chart screenshot:', error);
            resolve(null);
          });
        }).catch(error => {
          console.warn('html2canvas not available:', error);
          resolve(null);
        });
      } catch (error) {
        console.warn('Error capturing chart:', error);
        resolve(null);
      }
    });
  };
  
  // Add summary cards first
  if (chartsData.summary) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Dashboard Summary', 20, currentY);
    currentY += 15;
    
    // Try to capture the summary cards section
    const summarySelectors = [
      '#summary-cards',
      '[data-section="summary-cards"]',
      '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4'
    ];
    
    let summaryCardsElement = null;
    for (const selector of summarySelectors) {
      summaryCardsElement = document.querySelector(selector);
      if (summaryCardsElement) {
        console.log(`Found summary cards with selector: ${selector}`);
        break;
      }
    }
    
    if (summaryCardsElement) {
      try {
        const imgResult = await captureChartScreenshot(summaryCardsElement, 'Summary Cards');
        if (imgResult && imgResult.data) {
          // Calculate proper aspect ratio
          const maxWidth = 170; // mm
          const aspectRatio = imgResult.width / imgResult.height;
          const imgWidth = maxWidth;
          const imgHeight = maxWidth / aspectRatio;
          
          doc.addImage(imgResult.data, 'PNG', 20, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 20;
        } else {
          // Fallback to text representation
          currentY += 10;
          chartsData.summary.forEach((stat, index) => {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(31, 41, 55);
            doc.text(`${stat.label}: ${stat.value}`, 20, currentY);
            currentY += 8;
          });
          currentY += 10;
        }
      } catch (error) {
        console.warn('Error capturing summary cards:', error);
        // Fallback to text representation
        currentY += 10;
        chartsData.summary.forEach((stat, index) => {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(31, 41, 55);
          doc.text(`${stat.label}: ${stat.value}`, 20, currentY);
          currentY += 8;
        });
        currentY += 10;
      }
    } else {
      // Fallback to text representation
      currentY += 10;
      chartsData.summary.forEach((stat, index) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.text(`${stat.label}: ${stat.value}`, 20, currentY);
        currentY += 8;
      });
      currentY += 10;
    }
  }
  
  // Add charts with screenshots - try to capture sections first
  const chartSections = [
    { id: 'charts-and-graphs', title: 'Sales & Stock Analytics' },
    { id: 'bottom-section', title: 'Top Selling Products' }
  ];
  
  // Try to capture entire chart sections first
  for (const section of chartSections) {
    const sectionElement = document.querySelector(`#${section.id}`);
    if (sectionElement && currentY < 200) {
      try {
        const imgResult = await captureChartScreenshot(sectionElement, section.title);
        if (imgResult && imgResult.data) {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(59, 130, 246);
          doc.text(section.title, 20, currentY);
          currentY += 15;
          
          // Calculate proper aspect ratio
          const maxWidth = 170; // mm
          const maxHeight = 120; // mm
          const aspectRatio = imgResult.width / imgResult.height;
          
          let imgWidth = maxWidth;
          let imgHeight = maxWidth / aspectRatio;
          
          // If height exceeds max, scale down proportionally
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = maxHeight * aspectRatio;
          }
          
          doc.addImage(imgResult.data, 'PNG', 20, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 20;
        }
      } catch (error) {
        console.warn(`Error capturing ${section.title} section:`, error);
      }
    }
  }
  
  // Add individual charts with screenshots
  for (let i = 0; i < chartsData.length; i++) {
    const chart = chartsData[i];
    
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(chart.title, 20, currentY);
    
    currentY += 15;
    
    // Try to find and capture the actual chart element
    const chartSelectors = [
      `[data-chart="${chart.title.toLowerCase().replace(/\s+/g, '-')}"]`,
      '[data-chart="monthly-sales"]',
      '[data-chart="stock-distribution"]',
      '[data-chart="top-products"]',
      '.highcharts-container',
      '.chart-container'
    ];
    
    let chartElement = null;
    for (const selector of chartSelectors) {
      chartElement = document.querySelector(selector);
      if (chartElement) {
        console.log(`Found chart element with selector: ${selector}`);
        break;
      }
    }
    
    if (chartElement) {
      try {
        const imgResult = await captureChartScreenshot(chartElement, chart.title);
        if (imgResult && imgResult.data) {
          // Calculate proper aspect ratio
          const maxWidth = 170; // mm
          const maxHeight = 100; // mm
          const aspectRatio = imgResult.width / imgResult.height;
          
          let imgWidth = maxWidth;
          let imgHeight = maxWidth / aspectRatio;
          
          // If height exceeds max, scale down proportionally
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = maxHeight * aspectRatio;
          }
          
          doc.addImage(imgResult.data, 'PNG', 20, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        } else {
          // Fallback to generated chart representation
          generateChartRepresentation(doc, chart, 20, currentY, 170, 80);
          currentY += 100;
        }
      } catch (error) {
        console.warn('Error processing chart screenshot:', error);
        // Fallback to generated chart representation
        generateChartRepresentation(doc, chart, 20, currentY, 170, 80);
        currentY += 100;
      }
    } else {
      // Fallback to generated chart representation
      generateChartRepresentation(doc, chart, 20, currentY, 170, 80);
      currentY += 100;
    }
  }
  
  // Save the PDF and open in new tab
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const newWindow = window.open(pdfUrl, '_blank');
  
  if (newWindow) {
    // Clean up URL after a delay
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  } else {
    // Fallback to download if popup blocked
    doc.save(filename);
  }
};

export const getTableColumns = (pageType) => {
  const columnConfigs = {
    customers: [
      { key: 'name', header: 'Customer Name', width: 40 },
      { key: 'phone_number', header: 'Phone Number', width: 30 },
      { key: 'government_id', header: 'Government ID', width: 30 },
      { key: 'total_orders', header: 'Total Orders', width: 20, align: 'center' },
      { key: 'total_spent', header: 'Total Spent', width: 25, align: 'right' },
      { key: 'total_debt', header: 'Total Debt', width: 25, align: 'right' }
    ],
    suppliers: [
      { key: 'name', header: 'Supplier Name', width: 40 },
      { key: 'contact_info', header: 'Contact Info', width: 35 },
      { key: 'address', header: 'Address', width: 50 },
      { key: 'total_owed', header: 'Total Owed', width: 25, align: 'right' }
    ],
    sales: [
      { key: 'product_name', header: 'Product', width: 35 },
      { key: 'number', header: 'Quantity', width: 20, align: 'center' },
      { key: 'unit_price', header: 'Unit Price', width: 25, align: 'right' },
      { key: 'total_value', header: 'Total Value', width: 25, align: 'right' },
      { key: 'created_at', header: 'Date', width: 30 }
    ],
    stocks: [
      { key: 'product_name', header: 'Product', width: 35 },
      { key: 'supplier_name', header: 'Supplier', width: 35 },
      { key: 'current_quantity', header: 'Current Qty', width: 25, align: 'center' },
      { key: 'buying_price', header: 'Buying Price', width: 25, align: 'right' },
      { key: 'expiry_date', header: 'Expiry Date', width: 30 }
    ],
    inventory: [
      { key: 'name', header: 'Product Name', width: 40 },
      { key: 'qr_code', header: 'QR Code', width: 35 },
      { key: 'size', header: 'Size', width: 20, align: 'center' },
      { key: 'selling_price', header: 'Price', width: 25, align: 'right' },
      { key: 'stock_status', header: 'Stock Status', width: 25, align: 'center' }
    ]
  };
  
  return columnConfigs[pageType] || [];
};

export const formatValueForExport = (value, type) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF'
      }).format(value);
    case 'number':
      return new Intl.NumberFormat('en-RW').format(value);
    case 'date':
      return new Date(value).toLocaleDateString('en-US');
    case 'percentage':
      return `${value}%`;
    default:
      return value.toString();
  }
};
