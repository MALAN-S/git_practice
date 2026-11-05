import React from 'react';

export default function GenericModulePage({ title, description, icon }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>{icon}</span> {title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition">
          + Add New
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-lg font-bold text-gray-700">{title} Module</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
          Connected to the REST backend. Tables, filters, and forms will render here.
        </p>
      </div>
    </div>
  );
}
