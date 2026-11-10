import React, { useState, useRef, useEffect } from 'react';
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
  Check,
  Loader2,
  Clock,
  Timer,
  Activity,
  Sparkles,
  Database,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

export default function ImportCsv() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [totalParsedRows, setTotalParsedRows] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState(null);

  // Real-time Loader & Status Tracking States
  const [uploadStage, setUploadStage] = useState('idle'); // 'idle' | 'ready' | 'uploading' | 'validating' | 'saving' | 'stock' | 'complete' | 'error'
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Waiting for CSV file');
  const [elapsedSeconds, setElapsedSeconds] = useState('0.0');
  const [estimatedRemainingSeconds, setEstimatedRemainingSeconds] = useState(0);
  const [processingSpeed, setProcessingSpeed] = useState(0);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
      setUploadStage('error');
      return;
    }

    setParseError(null);
    setResult(null);
    setFile(selectedFile);
    setProgress(0);
    setProcessedCount(0);
    setElapsedSeconds('0.0');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setParseError('The uploaded CSV file is empty or missing data rows.');
          setPreviewRows([]);
          setUploadStage('error');
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

        const rowCount = dataRows.length;
        setTotalParsedRows(rowCount);
        setPreviewRows(dataRows.slice(0, 8)); // Show first 8 rows in preview

        // Estimate duration based on row count (~30-40ms per item, min 2s)
        const estSec = Math.max(2, Math.ceil((rowCount * 35) / 1000));
        setEstimatedRemainingSeconds(estSec);
        setUploadStage('ready');
        setStatusMessage(`Ready to import ${rowCount} ${rowCount === 1 ? 'item' : 'items'} from "${selectedFile.name}"`);
      } catch (err) {
        setParseError('Could not parse the CSV file. Please verify file format.');
        setUploadStage('error');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!uploading && e.dataTransfer.files && e.dataTransfer.files[0]) {
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
      const sampleCsv = `"Product Name","SKU","Category","Purchase Price","Selling Price","Current Stock","Min Stock Level","Description"\n`;
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
    if (!file || uploading) return;
    setUploading(true);
    setResult(null);
    setParseError(null);
    setProgress(5);
    setProcessedCount(0);
    setUploadStage('uploading');
    setStatusMessage('Uploading CSV file to server...');

    const formData = new FormData();
    formData.append('file', file);

    const startTime = Date.now();
    // Expected simulation duration: minimum 2.2 seconds for realistic UI feedback
    const expectedDurationMs = Math.max(2200, Math.min(10000, totalParsedRows * 40));

    // Clear existing timer if any
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = (elapsedMs / 1000).toFixed(1);
      setElapsedSeconds(elapsedSec);

      // Smooth progress climbing up to 92% while waiting for backend
      const targetProgress = Math.min(92, Math.round((elapsedMs / expectedDurationMs) * 92));

      setProgress((prev) => {
        const next = Math.max(prev, targetProgress);

        // Calculate processed items count based on progress
        const items = Math.min(
          Math.max(0, totalParsedRows - 1),
          Math.round((next / 100) * totalParsedRows)
        );
        setProcessedCount(items);

        // Calculate live speed
        if (elapsedMs > 400 && items > 0) {
          const speed = Math.round((items / (elapsedMs / 1000)));
          setProcessingSpeed(speed > 0 ? speed : Math.round(totalParsedRows / 2));
        }

        // Calculate estimated time remaining
        const remainingMs = Math.max(0, expectedDurationMs - elapsedMs);
        const remSec = Math.max(1, Math.ceil(remainingMs / 1000));
        setEstimatedRemainingSeconds(remSec);

        // Update stage & human-readable message
        if (next < 25) {
          setUploadStage('uploading');
          setStatusMessage('Uploading CSV file to backend...');
        } else if (next < 55) {
          setUploadStage('validating');
          setStatusMessage(`Checking columns, validating SKUs & categorizing (${items}/${totalParsedRows})...`);
        } else if (next < 85) {
          setUploadStage('saving');
          setStatusMessage(`Writing product entries to PostgreSQL (${items}/${totalParsedRows})...`);
        } else {
          setUploadStage('stock');
          setStatusMessage(`Recording initial stock inventory transactions (${items}/${totalParsedRows})...`);
        }

        return next;
      });
    }, 80);

    try {
      const res = await api.post('/products/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Ensure minimum visible animation time of 1500ms so user gets clear visual feedback
      const elapsedSoFar = Date.now() - startTime;
      if (elapsedSoFar < 1600) {
        await new Promise((resolve) => setTimeout(resolve, 1600 - elapsedSoFar));
      }

      if (timerRef.current) clearInterval(timerRef.current);

      const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      setElapsedSeconds(totalElapsed);
      setProgress(100);
      setProcessedCount(totalParsedRows);
      setEstimatedRemainingSeconds(0);
      setUploadStage('complete');
      setStatusMessage(`Completed! ${res.data.importedCount} items imported, ${res.data.skippedCount} skipped.`);

      // Short delay at 100% so user sees completion before displaying result summary
      setTimeout(() => {
        setResult(res.data);
        setUploading(false);
      }, 700);

    } catch (err) {
      if (timerRef.current) clearInterval(timerRef.current);
      setUploading(false);
      setUploadStage('error');
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to upload and process CSV file';
      setParseError(msg);
      setStatusMessage(`Import failed: ${msg}`);
    }
  };

  const resetAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFile(null);
    setPreviewRows([]);
    setPreviewHeaders([]);
    setTotalParsedRows(0);
    setResult(null);
    setParseError(null);
    setUploading(false);
    setUploadStage('idle');
    setProgress(0);
    setProcessedCount(0);
    setElapsedSeconds('0.0');
    setEstimatedRemainingSeconds(0);
    setProcessingSpeed(0);
    setStatusMessage('Waiting for CSV file');
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
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-11 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3.5 ${
              uploading
                ? 'border-indigo-300 bg-indigo-50/20 opacity-80 cursor-not-allowed'
                : isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99] cursor-pointer'
                : file
                ? 'border-emerald-300 bg-emerald-50/20 cursor-pointer'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60 bg-slate-50/30 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-sm ${
                uploading
                  ? 'bg-indigo-100 text-indigo-600 animate-pulse'
                  : file
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gradient-to-tr from-indigo-50 to-violet-100 text-indigo-600'
              }`}
            >
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : file ? (
                <FileSpreadsheet className="w-7 h-7" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {uploading
                  ? `Importing ${file?.name}...`
                  : file
                  ? file.name
                  : 'Choose a CSV file or drag & drop here'}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {uploading
                  ? `Processing items into database — please wait`
                  : file
                  ? `${(file.size / 1024).toFixed(1)} KB — Click to choose a different file`
                  : 'CSV files exported from Excel, Google Sheets, or other POS systems'}
              </p>
            </div>

            {!uploading && (
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
            )}
          </div>

          {parseError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* REAL-TIME LOADER & STATUS TRACKER CARD (Right Under Drag & Drop Box) */}
          {/* ========================================================================= */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-5">
            {/* Top Bar: Title & Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    uploading
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 animate-pulse'
                      : uploadStage === 'complete'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : file
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : uploadStage === 'complete' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Activity className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Import Status & Progress
                    {uploading && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {uploading
                      ? statusMessage
                      : file
                      ? `File loaded: ${totalParsedRows} records detected — ready to process`
                      : 'Upload a CSV spreadsheet to track real-time import progress'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                    uploading
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                      : uploadStage === 'complete'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : file
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Processing ({progress}%)</span>
                    </>
                  ) : uploadStage === 'complete' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Complete (100%)</span>
                    </>
                  ) : file ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ready to Import</span>
                    </>
                  ) : (
                    <span>Waiting for CSV</span>
                  )}
                </span>
              </div>
            </div>

            {/* 4 Metric Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat 1: Current Status */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
                </div>
                <p className="text-sm font-black text-slate-800 truncate">
                  {uploading
                    ? uploadStage === 'uploading'
                      ? 'Uploading File'
                      : uploadStage === 'validating'
                      ? 'Validating SKUs'
                      : uploadStage === 'saving'
                      ? 'Saving to DB'
                      : 'Updating Stock'
                    : uploadStage === 'complete'
                    ? 'Finished'
                    : file
                    ? 'Ready'
                    : 'Idle'}
                </p>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {uploading ? 'Live in-progress' : file ? 'File parsed' : 'No file chosen'}
                </p>
              </div>

              {/* Stat 2: Items Uploaded / Processed */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/70 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-500">
                  <Package className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Uploaded Items</span>
                </div>
                <p className="text-sm sm:text-base font-black text-indigo-950">
                  {uploading ? (
                    <span>
                      <strong className="text-indigo-600">{processedCount}</strong> / {totalParsedRows}
                    </span>
                  ) : uploadStage === 'complete' ? (
                    <span>
                      <strong className="text-emerald-600">{totalParsedRows}</strong> / {totalParsedRows}
                    </span>
                  ) : file ? (
                    <span>
                      0 / <strong>{totalParsedRows}</strong>
                    </span>
                  ) : (
                    '0 items'
                  )}
                </p>
                <p className="text-[11px] text-indigo-500/80 font-medium">
                  {uploading
                    ? `${progress}% of records processed`
                    : file
                    ? `${totalParsedRows} items queued`
                    : '0 items ready'}
                </p>
              </div>

              {/* Stat 3: Estimated Time Remaining */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Timer className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Time Remaining</span>
                </div>
                <p className="text-sm sm:text-base font-black text-slate-800">
                  {uploading ? (
                    <span>~{estimatedRemainingSeconds}s</span>
                  ) : uploadStage === 'complete' ? (
                    <span className="text-emerald-600">0s (Done)</span>
                  ) : file ? (
                    <span>~{estimatedRemainingSeconds}s</span>
                  ) : (
                    '—'
                  )}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {uploading
                    ? `Elapsed: ${elapsedSeconds}s`
                    : uploadStage === 'complete'
                    ? `Total: ${elapsedSeconds}s`
                    : 'Estimated processing'}
                </p>
              </div>

              {/* Stat 4: Processing Speed */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Speed</span>
                </div>
                <p className="text-sm sm:text-base font-black text-slate-800">
                  {uploading ? (
                    <span>~{processingSpeed || 25} / sec</span>
                  ) : uploadStage === 'complete' ? (
                    <span>
                      {Math.round(totalParsedRows / (parseFloat(elapsedSeconds) || 1)) || 25} / sec
                    </span>
                  ) : file ? (
                    <span>~25 / sec</span>
                  ) : (
                    '—'
                  )}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">Items processed per second</p>
              </div>
            </div>

            {/* Smooth Animated Progress Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-2">
                  <span>Import Progress</span>
                  {uploading && (
                    <span className="text-[11px] text-indigo-600 font-medium">
                      ({processedCount} of {totalParsedRows} records)
                    </span>
                  )}
                </span>
                <span className="font-mono font-black text-slate-800 text-sm">{progress}%</span>
              </div>

              {/* Bar track */}
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    uploadStage === 'complete'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600'
                  } ${uploading ? 'animate-pulse' : ''}`}
                  style={{ width: `${Math.max(progress > 0 ? 3 : 0, progress)}%` }}
                />
              </div>
            </div>

            {/* 4 Pipeline Stage Stepper */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              {/* Step 1: File Upload */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                  progress >= 25 || uploadStage === 'complete'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : uploading && uploadStage === 'uploading'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-200/50'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    progress >= 25 || uploadStage === 'complete'
                      ? 'bg-emerald-500 text-white'
                      : uploading && uploadStage === 'uploading'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {progress >= 25 || uploadStage === 'complete' ? (
                    <Check className="w-3 h-3" />
                  ) : uploading && uploadStage === 'uploading' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    '1'
                  )}
                </div>
                <span className="truncate">1. File Upload</span>
              </div>

              {/* Step 2: Validate SKUs */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                  progress >= 55 || uploadStage === 'complete'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : uploading && uploadStage === 'validating'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-200/50'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    progress >= 55 || uploadStage === 'complete'
                      ? 'bg-emerald-500 text-white'
                      : uploading && uploadStage === 'validating'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {progress >= 55 || uploadStage === 'complete' ? (
                    <Check className="w-3 h-3" />
                  ) : uploading && uploadStage === 'validating' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    '2'
                  )}
                </div>
                <span className="truncate">2. Validate SKUs</span>
              </div>

              {/* Step 3: Save to DB */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                  progress >= 85 || uploadStage === 'complete'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : uploading && uploadStage === 'saving'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-200/50'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    progress >= 85 || uploadStage === 'complete'
                      ? 'bg-emerald-500 text-white'
                      : uploading && uploadStage === 'saving'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {progress >= 85 || uploadStage === 'complete' ? (
                    <Check className="w-3 h-3" />
                  ) : uploading && uploadStage === 'saving' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    '3'
                  )}
                </div>
                <span className="truncate">3. Save to DB</span>
              </div>

              {/* Step 4: Stock Ledger */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-semibold ${
                  progress >= 100 || uploadStage === 'complete'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                    : uploading && uploadStage === 'stock'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-200/50'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    progress >= 100 || uploadStage === 'complete'
                      ? 'bg-emerald-500 text-white'
                      : uploading && uploadStage === 'stock'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {progress >= 100 || uploadStage === 'complete' ? (
                    <Check className="w-3 h-3" />
                  ) : uploading && uploadStage === 'stock' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    '4'
                  )}
                </div>
                <span className="truncate">4. Stock Ledger</span>
              </div>
            </div>
          </div>

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
                    disabled={uploading}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-100 disabled:opacity-60"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          Importing ({processedCount}/{totalParsedRows})...
                        </span>
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
                  Finished in <strong className="text-slate-700">{elapsedSeconds}s</strong> • All shop items have been processed and added to the inventory database.
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
