import React, { useState, useEffect, useRef } from 'react';
import { databases } from '../../appwrite/config';
import { Query } from 'appwrite';
import jsPDF from 'jspdf';

const DATABASE_ID = 'cargo-car-rental';
const BOOKINGS_COLLECTION_ID = 'bookings';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const GenerateReport = ({ generatedBy = 'Admin' }) => {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef(null);

  // Helper to build queries
  const buildQueries = () => {
    let queries = [];
    if (status) queries.push(Query.equal('status', status));
    // Filter by pickupDate >= dateFrom
    if (dateFrom) queries.push(Query.greaterThanEqual('pickupDate', new Date(dateFrom).toISOString()));
    // Filter by returnDate <= dateTo (end of day)
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      queries.push(Query.lessThan('returnDate', toDate.toISOString()));
    }
    return queries;
  };

  // Helper to generate PDF as Blob
  const generatePdfBlob = async (bookings) => {
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalCost) || 0), 0);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    let y = 40;
    const margin = 40;

    // Company Header
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text('CarGo', margin, y);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text('Cargo Car Rental Services', margin, y + 18);
    pdf.text('123 Main St, Metro Manila, Philippines', margin, y + 34);
    pdf.text('Email: support@cargo.com | Phone: +63 912 345 6789', margin, y + 50);
    y += 70;

    // Report Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Audit Report - Bookings Summary', margin, y);
    y += 24;

    // Filter Summary
    let filterSummary = '';
    if (status) filterSummary += `Status: ${status}  `;
    if (dateFrom) filterSummary += `From: ${dateFrom}  `;
    if (dateTo) filterSummary += `To: ${dateTo}`;
    if (filterSummary) {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Filters: ${filterSummary.trim()}`, margin, y);
      y += 14;
    }

    // Totals
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Total Bookings: ${bookings.length}`, margin, y);
    // Removed Total Revenue here
    y += 18;

    // Section line
    pdf.setDrawColor(180, 180, 180);
    pdf.line(margin, y, 800, y);
    y += 12;

    // Table header
    pdf.setFontSize(14); // Increased from 11
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text('Booking', margin, y);
    pdf.text('User', margin + 90, y); // Increased spacing
    pdf.text('Vehicle', margin + 250, y);
    pdf.text('Pickup', margin + 410, y);
    pdf.text('Return', margin + 530, y);
    pdf.text('Status', margin + 650, y);
    pdf.text('Total', margin + 740, y);
    y += 20; // Increased from 14
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, 900, y); // Extended line for wider table
    y += 14; // Increased from 10

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(13); // Increased from 10
    pdf.setTextColor(0, 0, 0);
    bookings.forEach(b => {
      const shortId = b.$id ? b.$id.slice(0, 6) : '-';
      pdf.text(shortId, margin, y);
      pdf.text(b.userName || '-', margin + 90, y);
      pdf.text(`${b.vehicleMake || ''} ${b.vehicleModel || ''}`.trim(), margin + 250, y);
      pdf.text(b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : '-', margin + 410, y);
      pdf.text(b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '-', margin + 530, y);
      pdf.text(b.status, margin + 650, y);
      pdf.text(`${b.totalCost !== undefined ? Number(b.totalCost).toLocaleString() : '-'}`, margin + 740, y);
      y += 18; // Increased from 13
      if (y > 520) {
        pdf.addPage();
        y = 40;
        // Repeat table header on new page
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 64, 175);
        pdf.text('Booking', margin, y);
        pdf.text('User', margin + 90, y);
        pdf.text('Vehicle', margin + 250, y);
        pdf.text('Pickup', margin + 410, y);
        pdf.text('Return', margin + 530, y);
        pdf.text('Status', margin + 650, y);
        pdf.text('Total', margin + 740, y);
        y += 20;
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, 900, y);
        y += 14;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(13);
        pdf.setTextColor(0, 0, 0);
      }
    });

    // Grand Total (above footer)
    y = 540;
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Grand Total: ${totalRevenue.toLocaleString()}`, margin, y);

    // Footer
    y = 560;
    pdf.setDrawColor(180, 180, 180);
    pdf.line(margin, y, 800, y);

    // Add generated at/by above the footer message
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 14);
    pdf.text(`Generated by: ${generatedBy}`, margin, y + 28);

    // Footer message
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(120, 120, 120);
    pdf.text('This is a system-generated audit report. For inquiries, contact support@cargo.com', margin, y + 44);

    return pdf.output('blob');
  };

  // PDF Preview effect
  useEffect(() => {
    let ignore = false;
    setPreviewLoading(true);
    // Clean up previous blob URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    // Fetch bookings and generate preview
    (async () => {
      try {
        const queries = buildQueries();
        const res = await databases.listDocuments(
          DATABASE_ID,
          BOOKINGS_COLLECTION_ID,
          queries
        );
        const bookings = res.documents;
        const blob = await generatePdfBlob(bookings);
        if (!ignore) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          previewUrlRef.current = url;
        }
      } catch {
        if (!ignore) setPreviewUrl(null);
      }
      if (!ignore) setPreviewLoading(false);
    })();
    return () => {
      ignore = true;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [dateFrom, dateTo, status]);

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const queries = buildQueries();
      const res = await databases.listDocuments(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        queries
      );
      const bookings = res.documents;
      const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalCost) || 0), 0);
      // PDF layout
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      let y = 40;
      const margin = 40;

      // Company Header
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 64, 175);
      pdf.text('CarGo', margin, y);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      pdf.text('Cargo Car Rental Services', margin, y + 18);
      pdf.text('123 Main St, Metro Manila, Philippines', margin, y + 34);
      pdf.text('Email: support@cargo.com | Phone: +63 912 345 6789', margin, y + 50);
      y += 70;

      // Report Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Audit Report - Bookings Summary', margin, y);
      y += 24;

      // Filter Summary
      let filterSummary = '';
      if (status) filterSummary += `Status: ${status}  `;
      if (dateFrom) filterSummary += `From: ${dateFrom}  `;
      if (dateTo) filterSummary += `To: ${dateTo}`;
      if (filterSummary) {
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Filters: ${filterSummary.trim()}`, margin, y);
        y += 14;
      }

      // Totals
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Bookings: ${bookings.length}`, margin, y);
      // Removed Total Revenue here
      y += 18;

      // Section line
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, y, 800, y);
      y += 12;

      // Table header
      pdf.setFontSize(14); // Increased from 11
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 64, 175);
      pdf.text('Booking', margin, y);
      pdf.text('User', margin + 90, y); // Increased spacing
      pdf.text('Vehicle', margin + 250, y);
      pdf.text('Pickup', margin + 410, y);
      pdf.text('Return', margin + 530, y);
      pdf.text('Status', margin + 650, y);
      pdf.text('Total', margin + 740, y);
      y += 20; // Increased from 14
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, 900, y); // Extended line for wider table
      y += 14; // Increased from 10

      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(13); // Increased from 10
      pdf.setTextColor(0, 0, 0);
      bookings.forEach(b => {
        const shortId = b.$id ? b.$id.slice(0, 6) : '-';
        pdf.text(shortId, margin, y);
        pdf.text(b.userName || '-', margin + 90, y);
        pdf.text(`${b.vehicleMake || ''} ${b.vehicleModel || ''}`.trim(), margin + 250, y);
        pdf.text(b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : '-', margin + 410, y);
        pdf.text(b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '-', margin + 530, y);
        pdf.text(b.status, margin + 650, y);
        pdf.text(`${b.totalCost !== undefined ? Number(b.totalCost).toLocaleString() : '-'}`, margin + 740, y);
        y += 18; // Increased from 13
        if (y > 520) {
          pdf.addPage();
          y = 40;
          // Repeat table header on new page
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 64, 175);
          pdf.text('Booking', margin, y);
          pdf.text('User', margin + 90, y);
          pdf.text('Vehicle', margin + 250, y);
          pdf.text('Pickup', margin + 410, y);
          pdf.text('Return', margin + 530, y);
          pdf.text('Status', margin + 650, y);
          pdf.text('Total', margin + 740, y);
          y += 20;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, y, 900, y);
          y += 14;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(13);
          pdf.setTextColor(0, 0, 0);
        }
      });

      // Grand Total (above footer)
      y = 540;
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Grand Total: ${totalRevenue.toLocaleString()}`, margin, y);

      // Footer
      y = 560;
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, y, 800, y);

      // Add generated at/by above the footer message
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 14);
      pdf.text(`Generated by: ${generatedBy}`, margin, y + 28);

      // Footer message
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(120, 120, 120);
      pdf.text('This is a system-generated audit report. For inquiries, contact support@cargo.com', margin, y + 44);

      pdf.save('CarGo-Bookings-Audit-Report.pdf');
    } catch (e) {
      alert('Failed to generate report: ' + (e?.message || e));
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Generate Report</h2>
      {/* Date filter description */}
      <div className="mb-2 text-sm text-gray-600">
        Select a date range to filter bookings by their pickup and return dates. "From" sets the earliest pickup date, and "To" sets the latest return date (inclusive).
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* PDF Preview */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">PDF Preview</label>
        <div className="border rounded bg-gray-50 flex items-center justify-center" style={{ minHeight: 400, minWidth: 300 }}>
          {previewLoading ? (
            <span className="text-gray-400">Loading preview...</span>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              title="PDF Preview"
              style={{ width: '100%', height: 400, border: 'none' }}
            />
          ) : (
            <span className="text-gray-400">No preview available.</span>
          )}
        </div>
      </div>
      <button
        onClick={handleGeneratePDF}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Generating...' : 'Generate PDF Report'}
      </button>
    </div>
  );
};

export default GenerateReport;
