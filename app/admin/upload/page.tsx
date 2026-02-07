'use client';

import { useState } from 'react';
import { downloadPprAndImport, type PprUploadResponse } from '@/lib/api';

export default function AdminUploadPage() {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<PprUploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownloadAndImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatus('downloading');
    setResult(null);
    try {
      const data = await downloadPprAndImport();
      setResult(data);
      setStatus('done');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string }; status?: number } }).response?.data?.detail
          || (err as { response?: { status?: number } }).response?.status
          || String(err)
        : String(err);
      setErrorMessage(typeof msg === 'string' ? msg : `Error: ${msg}`);
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        PPR Download & Import
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Download PPR-ALL.zip from propertypriceregister.ie, unzip the CSV, and import. Existing properties (by address) are skipped or updated; new ones are created, geocoded, and Daft.ie scraped.
      </p>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <form onSubmit={handleDownloadAndImport} className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === 'downloading'}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
          >
            {status === 'downloading' ? 'Downloading & importing…' : 'Download & import PPR-ALL'}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Fetches PPR-ALL.zip from propertypriceregister.ie, unzips the CSV, and runs the import. Can take several minutes for the full dataset.
        </p>
        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errorMessage}</p>
        )}
      </div>

      {status === 'done' && result && (
        <div className="mt-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
          <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">Import complete.</p>
          <h2 className="text-lg font-semibold mb-3">Result</h2>
          <ul className="space-y-1 text-sm">
            <li>Total rows: {result.total_rows}</li>
            <li>Unique properties: {result.unique_properties}</li>
            <li>Created: {result.created}</li>
            <li>Updated: {result.updated}</li>
            <li>Skipped: {result.skipped}</li>
            <li>Geocoded: {result.geocoded}</li>
            <li>Failed geocode: {result.failed_geocode}</li>
            <li>Daft.ie scraped: {result.daft_scraped}</li>
            <li>Failed Daft.ie: {result.failed_daft}</li>
          </ul>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="font-medium text-amber-600 dark:text-amber-400">Errors ({result.errors.length})</p>
              <ul className="mt-1 text-xs max-h-40 overflow-y-auto space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-red-600 dark:text-red-400">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
