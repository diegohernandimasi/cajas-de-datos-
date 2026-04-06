/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import { User as UserIcon, Phone, Save, Trash2, FileSpreadsheet, CheckCircle2, Download, LogIn, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  runTransaction, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  User 
} from './firebase';

interface Client {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  createdAt: Timestamp;
}

interface FormData {
  nombre: string;
  apellido: string;
  telefono: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    telefono: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time clients listener
  useEffect(() => {
    if (!user) {
      setClients([]);
      return;
    }

    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.data().id,
      })) as Client[];
      setClients(clientsData);
    }, (error) => {
      console.error("Error fetching clients:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      console.log("Iniciando sesión con Google...");
      await signInWithPopup(auth, googleProvider);
      console.log("Sesión iniciada con éxito");
    } catch (error: any) {
      console.error("Error detallado de login:", error);
      let message = "Ocurrió un error al iniciar sesión.";
      
      if (error.code === 'auth/popup-blocked') {
        message = "El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = "Se canceló la solicitud de inicio de sesión.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "El inicio de sesión con Google no está habilitado en Firebase.";
      } else if (error.message) {
        message = `Error: ${error.message}`;
      }
      
      setAuthError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const exportToExcel = (data: Client[]) => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Sort by ID for Excel export
    const sortedData = [...data].sort((a, b) => a.id - b.id);

    const excelData = sortedData.map(c => ({
      'Nro Registro': c.id,
      'Nombre': c.nombre,
      'Apellido': c.apellido,
      'Teléfono': c.telefono,
      'Fecha Registro': c.createdAt?.toDate().toLocaleString() || ''
    }));

    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Clientes');
    writeFile(wb, 'cliente.xlsx');
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      alert('Por favor complete todos los campos');
      return;
    }

    setIsSaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'metadata', 'counters');
        const counterDoc = await transaction.get(counterRef);
        
        let nextId = 1;
        if (counterDoc.exists()) {
          nextId = counterDoc.data().count + 1;
        }
        
        // Update global counter
        transaction.set(counterRef, { count: nextId }, { merge: true });
        
        // Add new client
        const clientRef = doc(collection(db, 'clients'));
        transaction.set(clientRef, {
          id: nextId,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          createdAt: serverTimestamp(),
          uid: user?.uid // Track who added it
        });
      });

      // Clear the form
      setFormData({
        nombre: '',
        apellido: '',
        telefono: '',
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Transaction failed: ", error);
      alert("Error al guardar los datos. Intente nuevamente.");
    } finally {
      setIsSaving(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-[32px] shadow-xl p-10 text-center space-y-8"
        >
          <div className="p-4 bg-blue-50 w-fit mx-auto rounded-3xl">
            <FileSpreadsheet className="w-12 h-12 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Bienvenido</h1>
            <p className="text-gray-500">Inicie sesión para sincronizar sus datos entre dispositivos</p>
          </div>
          
          {authError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
              {authError}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Iniciar con Google
          </button>
        </motion.div>
      </div>
    );
  }

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
                  Gestión Global
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Sincronizado en tiempo real
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <img src={user.photoURL || ''} className="w-6 h-6 rounded-full" alt="User" />
              <span className="text-xs font-semibold text-gray-600">{user.displayName}</span>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {clients.length} Registros Totales
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 gap-5">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] flex items-center gap-2 ml-1">
                <UserIcon className="w-3 h-3" />
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
                <UserIcon className="w-3 h-3" />
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
                disabled={isSaving}
                className="flex-1 px-4 py-4 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] px-4 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
            
            <button
              onClick={handleBringData}
              disabled={isSaving}
              className="w-full px-4 py-4 text-sm font-bold text-blue-600 bg-white border-2 border-blue-100 hover:border-blue-600 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
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
                ¡Registro guardado en la nube!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
              v3.0 Cloud Sync
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {clients.length > 0 ? `Último ID: ${Math.max(...clients.map(c => c.id))}` : 'Sin registros'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}



