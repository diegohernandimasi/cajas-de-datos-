/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import { User, Phone, Save, Trash2, FileSpreadsheet, CheckCircle2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Client {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
}

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
  const [clients, setClients] = useState<Client[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load clients from localStorage on mount
  useEffect(() => {
    const savedClients = localStorage.getItem('clients_data');
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch (e) {
        console.error('Error loading clients', e);
      }
    }
  }, []);

  // Save clients to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('clients_data', JSON.stringify(clients));
  }, [clients]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const exportToExcel = (data: Client[]) => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Format data for Excel
    const excelData = data.map(c => ({
      'Nro Registro': c.id,
      'Nombre': c.nombre,
      'Apellido': c.apellido,
      'Teléfono': c.telefono
    }));

    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Clientes');

    // Always use the same filename
    writeFile(wb, 'cliente.xlsx');
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      alert('Por favor complete todos los campos');
      return;
    }

    const nextId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    
    const newClient: Client = {
      id: nextId,
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono,
    };

    const updatedClients = [...clients, newClient];
    setClients(updatedClients);

    // Export the updated list
    exportToExcel(updatedClients);

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

  const handleBringData = () => {
    exportToExcel(clients);
  };

  const handleClear = () => {
    setFormData({
      nombre: '',
      apellido: '',
      telefono: '',
    });
  };

  const handleResetAll = () => {
    if (window.confirm('¿Está seguro de que desea borrar TODOS los registros?')) {
      setClients([]);
      localStorage.removeItem('clients_data');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-[32px] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Gestión de Clientes
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Registro persistente en cliente.xlsx
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {clients.length} Registros
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 gap-5">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2 ml-1">
                <User className="w-3 h-3" />
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ingrese nombre"
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-900 placeholder:text-gray-300 font-medium"
              />
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2 ml-1">
                <User className="w-3 h-3" />
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                placeholder="Ingrese apellido"
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-900 placeholder:text-gray-300 font-medium"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2 ml-1">
                <Phone className="w-3 h-3" />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Ingrese teléfono"
                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-gray-900 placeholder:text-gray-300 font-medium"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-4 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] px-4 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" />
                Guardar Cliente
              </button>
            </div>
            
            <button
              onClick={handleBringData}
              className="w-full px-4 py-4 text-sm font-bold text-blue-600 bg-white border-2 border-blue-100 hover:border-blue-600 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Traer datos (Abrir Excel)
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
              <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 text-sm font-bold shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                ¡Registro #{clients.length} guardado en cliente.xlsx!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button 
            onClick={handleResetAll}
            className="text-[10px] text-gray-400 hover:text-red-400 uppercase tracking-widest font-bold transition-colors"
          >
            Resetear Base de Datos
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
              v2.0 Persistent
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}


