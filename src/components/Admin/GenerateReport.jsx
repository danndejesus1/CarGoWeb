import React, { useState } from 'react';
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

const GenerateReport = () => {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      // Build filters
      let queries = [];
      if (status) queries.push(Query.equal('status', status));
      if (dateFrom) queries.push(Query.greaterThanEqual('createdAt', new Date(dateFrom).toISOString()));
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setDate(toDate.getDate() + 1);
        queries.push(Query.lessThan('createdAt', toDate.toISOString()));
      }

      // Fetch filtered bookings
      const res = await databases.listDocuments(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        queries
      );
      const bookings = res.documents;

      // Aggregate totals
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

      // Report Title & Date
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Audit Report - Bookings Summary', margin, y);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin + 350, y);
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
      pdf.text(`Total Revenue: ${totalRevenue.toLocaleString()}`, margin + 200, y);
      y += 18;

      // Section line
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, y, 800, y);
      y += 12;

      // Table header
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 64, 175);
      pdf.text('Booking', margin, y); // Shorten header
      pdf.text('User', margin + 70, y);
      pdf.text('Vehicle', margin + 190, y);
      pdf.text('Pickup', margin + 310, y);
      pdf.text('Return', margin + 410, y);
      pdf.text('Status', margin + 510, y);
      pdf.text('Total', margin + 590, y);
      y += 14;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, 800, y);
      y += 10;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      bookings.forEach(b => {
        // Show only first 6 chars of booking ID for compactness
        const shortId = b.$id ? b.$id.slice(0, 6) : '-';
        pdf.text(shortId, margin, y);
        pdf.text(b.userName || '-', margin + 70, y);
        pdf.text(`${b.vehicleMake || ''} ${b.vehicleModel || ''}`.trim(), margin + 190, y);
        pdf.text(b.pickupDate ? new Date(b.pickupDate).toLocaleDateString() : '-', margin + 310, y);
        pdf.text(b.returnDate ? new Date(b.returnDate).toLocaleDateString() : '-', margin + 410, y);
        pdf.text(b.status, margin + 510, y);
        pdf.text(`${b.totalCost !== undefined ? Number(b.totalCost).toLocaleString() : '-'}`, margin + 590, y);
        y += 13;
        if (y > 520) {
          pdf.addPage();
          y = 40;
          // Repeat table header on new page
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 64, 175);
          pdf.text('Booking', margin, y);
          pdf.text('User', margin + 70, y);
          pdf.text('Vehicle', margin + 190, y);
          pdf.text('Pickup', margin + 310, y);
          pdf.text('Return', margin + 410, y);
          pdf.text('Status', margin + 510, y);
          pdf.text('Total', margin + 590, y);
          y += 14;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, y, 800, y);
          y += 10;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
        }
      });

      // Footer
      y = 560;
      pdf.setDrawColor(180, 180, 180);
      pdf.line(margin, y, 800, y);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(120, 120, 120);
      pdf.text('This is a system-generated audit report. For inquiries, contact support@cargo.com', margin, y + 16);

      pdf.save('CarGo-Bookings-Audit-Report.pdf');
    } catch (e) {
      alert('Failed to generate report: ' + (e?.message || e));
    }
    setLoading(false);
  };

  return (
    <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Generate Report</h2>
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
