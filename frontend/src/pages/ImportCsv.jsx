import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  Package,
  Boxes,
  HelpCircle,
  Eye,
  Check
} from 'lucide-react';

export default function ImportCsv() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [totalParsedRows, setTotalParsedRows] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState(null);

  // Parse CSV line handling quotes
  const parseCsvLine = (text) => {
    const p = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        p.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        cur = '';
      } else {
        cur += c;
      }
    }
    p.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return p;
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a valid .csv file');
      return;
    }

    setParseError(null);
    setResult(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setParseError('The uploaded CSV file is empty or missing data rows.');
          setPreviewRows([]);
          return;
        }

        const headers = parseCsvLine(lines[0]);
        setPreviewHeaders(headers);

        const dataRows = [];
        for (let i = 1; i < lines.length; i++) {
          const rowVals = parseCsvLine(lines[i]);
          if (rowVals.some((v) => v.length > 0)) {
            dataRows.push(rowVals);
          }
        }

        setTotalParsedRows(dataRows.length);
        // Show first 8 rows in preview
        setPreviewRows(dataRows.slice(0, 8));
      } catch (err) {
        setParseError('Could not parse the CSV file. Please verify file format.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await api.get('/products/sample-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shop_items_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // Fallback client download if API isn't reached
      const sampleCsv = `Product Name,SKU,Category,Purchase Price,Selling Price,Current Stock,Min Stock Level,Description
A4 Copier Paper 75 GSM (500 Sheets),P-A4-75,Paper & Stationery,240.00,320.00,50,10,High quality A4 printing paper
Blue Ball Pen (0.7mm),P-PEN-BLU,Writing,5.00,10.00,100,20,Smooth flow blue ball point pen
Black Gel Pen,P-PEN-BLK,Writing,12.00,20.00,60,15,Waterproof black gel pen
Spiral Notebook (160 Pages),P-NOTE-160,Notebooks,45.00,70.00,35,5,Ruled student notebook
Stapler No. 10,P-STP-10,Desk Accessories,65.00,95.00,20,5,Compact metal stapler
Stapler Pins No. 10 Box,P-STP-PIN,Desk Accessories,15.00,25.00,40,10,Compatible stapler pin box
Transparent File Folder A4,P-FLD-CLR,Files & Folders,10.00,20.00,80,15,Plastic document folder
Sticky Notes 3x3 Yellow,P-STK-YEL,Desk Accessories,25.00,40.00,30,8,Self-adhesive reminder pads
Permanent Marker Black,P-MKR-BLK,Writing,18.00,30.00,45,10,Bold bullet tip marker
Calculator 12-Digit,P-CALC-12,Electronics,220.00,350.00,15,3,Dual power desktop calculator`;

      const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shop_items_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/products/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setParseError(err.response?.data?.message || err.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setUploading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewRows([]);
    setPreviewHeaders([]);
    setTotalParsedRows(0);
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition border border-slate-200/60"
            title="Back to Products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Bulk Import Products</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                CSV Upload
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Have existing shop items? Upload your CSV spreadsheet to add all stationery and inventory in one click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200/80 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download Sample CSV</span>
          </button>
          <Link
            to="/products"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100"
          >
            <Package className="w-4 h-4" />
            <span>View Products</span>
          </Link>
        </div>
      </div>

      {/* 4 Steps Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
            1
          </div>
          <h4 className="text-xs font-bold text-slate-800">Download Template</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Get the sample CSV with pre-configured headers and example stationery items.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
            2
          </div>
          <h4 className="text-xs font-bold text-slate-800">Fill Shop Items</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Add your product names, SKUs, buy price, selling price, and opening stock count.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
            3
          </div>
          <h4 className="text-xs font-bold text-slate-800">Upload & Preview</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Drag & drop the CSV file here to instantly check and preview all records.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold">
            4
          </div>
          <h4 className="text-xs font-bold text-slate-800">Auto Save & Stock</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            Categories auto-generate, existing items are safely checked, and stock logs are created.
          </p>
        </div>
      </div>

      {/* Upload Drag & Drop Zone */}
      {!result && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3.5 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : file
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60 bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-sm ${
                file
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gradient-to-tr from-indigo-50 to-violet-100 text-indigo-600'
              }`}
            >
              {file ? <FileSpreadsheet className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {file ? file.name : 'Choose a CSV file or drag & drop here'}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB — Click to choose a different file`
                  : 'CSV files exported from Excel, Google Sheets, or other POS systems'}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-1 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              Browse Computer
            </button>
          </div>

          {parseError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* CSV Live Preview */}
          {previewRows.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">
                    Data Preview ({totalParsedRows} total {totalParsedRows === 1 ? 'item' : 'items'} found)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    (Showing first {previewRows.length} rows)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetAll}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Importing Items...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Confirm & Import {totalParsedRows} Items</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        {previewHeaders.map((h, i) => (
                          <th key={i} className="py-2.5 px-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/60 transition">
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{rIdx + 1}</td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                              {cell || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Result Screen */}
      {result && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-emerald-500/10 via-indigo-500/5 to-slate-50 border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">CSV Import Complete!</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Your shop items have been processed and added to the inventory database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetAll}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                Import Another File
              </button>
              <Link
                to="/products"
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100 flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>Go to Products Table</span>
              </Link>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rows in CSV</p>
              <p className="text-2xl font-black text-slate-800">{result.totalRows}</p>
              <p className="text-[11px] text-slate-400 font-medium">Rows parsed from your file</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 shadow-sm space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Successfully Imported</p>
              <p className="text-2xl font-black text-emerald-700">{result.importedCount}</p>
              <p className="text-[11px] text-emerald-600 font-medium">New products ready for billing & stock</p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 shadow-sm space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Skipped (Duplicate SKU)</p>
              <p className="text-2xl font-black text-amber-700">{result.skippedCount}</p>
              <p className="text-[11px] text-amber-600 font-medium">Duplicate SKUs skipped to protect data</p>
            </div>
          </div>

          {/* Detailed Messages Log */}
          {(result.messages?.length > 0 || result.errors?.length > 0) && (
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Import Log Details</h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {result.messages?.map((msg, i) => (
                  <div key={i} className="text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                    ℹ️ {msg}
                  </div>
                ))}
                {result.errors?.map((err, i) => (
                  <div key={i} className="text-rose-600 bg-rose-50/50 px-3 py-1.5 rounded-lg border border-rose-100">
                    ⚠️ {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
