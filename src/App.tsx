/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent } from 'react';
import { utils, writeFile } from 'xlsx';
import { User, Phone, Save, Trash2, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormData {
  nombre: string;
  apellido: string;
  telefono: string;
}

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    telefono: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      alert('Por favor complete todos los campos');
      return;
    }

    // Create a worksheet from the data
    const ws = utils.json_to_sheet([
      {
        Nombre: formData.nombre,
        Apellido: formData.apellido,
        Teléfono: formData.telefono,
      },
    ]);

    // Create a workbook and add the worksheet
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Datos');

    // Generate filename with timestamp
    const fileName = `datos_${formData.nombre}_${Date.now()}.xlsx`;

    // Download the file
    writeFile(wb, fileName);

    // Clear the form
    setFormData({
      nombre: '',
      apellido: '',
      telefono: '',
    });

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleClear = () => {
    setFormData({
      nombre: '',
      apellido: '',
      telefono: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Registro de Datos
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Ingrese la información para exportar a Excel
          </p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" />
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej. Juan"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Apellido */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" />
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                placeholder="Ej. Pérez"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-3 h-3" />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Ej. +54 9 11 1234-5678"
                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              Guardar en Excel
            </button>
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-8 pb-8"
            >
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                ¡Datos guardados y descargados con éxito!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Excel Exporter v1.0
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-gray-200" />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

