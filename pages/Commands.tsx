
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Terminal, 
  X,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Command } from '../types';
import { api } from '../services/api';

export const CommandsPage: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [formData, setFormData] = useState({ trigger: '', response: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    setLoading(true);
    try {
      // const data = await api.get('/commands');
      // Mock data
      await new Promise(res => setTimeout(res, 600));
      setCommands([
        { id: '1', trigger: '.help', response: 'قائمة الأوامر المتاحة:\n1. .ping\n2. .stats' },
        { id: '2', trigger: '.ping', response: 'pong! البوت يعمل بنجاح' },
        { id: '3', trigger: 'السلام عليكم', response: 'وعليكم السلام ورحمة الله وبركاته' },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCommand) {
        // await api.put(`/commands/${editingCommand.id}`, formData);
        setCommands(commands.map(c => c.id === editingCommand.id ? { ...c, ...formData } : c));
      } else {
        // const newCmd = await api.post('/commands', formData);
        const newId = Math.random().toString(36).substring(7);
        setCommands([...commands, { id: newId, ...formData }]);
      }
      closeModal();
    } catch (err) {
      alert('فشلت العملية');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الأمر؟')) return;
    try {
      // await api.delete(`/commands/${id}`);
      setCommands(commands.filter(c => c.id !== id));
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const openModal = (command?: Command) => {
    if (command) {
      setEditingCommand(command);
      setFormData({ trigger: command.trigger, response: command.response });
    } else {
      setEditingCommand(null);
      setFormData({ trigger: '', response: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCommand(null);
    setFormData({ trigger: '', response: '' });
  };

  const filteredCommands = commands.filter(c => 
    c.trigger.toLowerCase().includes(search.toLowerCase()) || 
    c.response.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Terminal size={28} className="text-blue-600" />
            إدارة الأوامر
          </h1>
          <p className="text-slate-500 mt-1">قم بتعريف الكلمات المفتاحية وردود البوت التلقائية</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={20} />
          إضافة أمر جديد
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="بحث في الأوامر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pr-11 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm font-bold">
                <th className="px-6 py-4 border-b border-slate-100">الكلمة المفتاحية (Trigger)</th>
                <th className="px-6 py-4 border-b border-slate-100">الرد (Response)</th>
                <th className="px-6 py-4 border-b border-slate-100 w-32">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري تحميل الأوامر...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCommands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    {search ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد أوامر معرفة بعد'}
                  </td>
                </tr>
              ) : (
                filteredCommands.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <code className="bg-slate-100 text-blue-600 px-2 py-1 rounded-md text-sm font-mono font-bold">
                        {cmd.trigger}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 text-sm line-clamp-2 max-w-md leading-relaxed">
                        {cmd.response}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(cmd)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cmd.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">
                {editingCommand ? 'تعديل أمر' : 'إضافة أمر جديد'}
              </h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block mr-1">الكلمة المفتاحية (Trigger)</label>
                <input
                  type="text"
                  required
                  value={formData.trigger}
                  onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                  placeholder="مثال: .help أو السلام"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block mr-1">الرد (Response)</label>
                <textarea
                  rows={5}
                  required
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  placeholder="ماذا يجب أن يرد البوت؟"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  حفظ الأمر
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
