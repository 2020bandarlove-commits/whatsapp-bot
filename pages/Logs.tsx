
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Activity, 
  History, 
  User, 
  Clock, 
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { WhatsAppMessage, SystemEvent } from '../types';

export const LogsPage: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'messages' | 'events'>('messages');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Simulation of fetching messages and events
      await new Promise(res => setTimeout(res, 800));
      
      setMessages([
        { at: new Date().toISOString(), from: '966501234567', text: 'السلام عليكم، كيف حالك؟' },
        { at: new Date(Date.now() - 3600000).toISOString(), from: '966509876543', text: 'أريد معرفة الأسعار المتاحة' },
        { at: new Date(Date.now() - 7200000).toISOString(), from: '966504445556', text: '.help' },
        { at: new Date(Date.now() - 86400000).toISOString(), from: '966502221110', text: 'شكراً جزيلاً لك' },
      ]);

      setEvents([
        { id: '1', type: 'status', message: 'تم ربط البوت بنجاح', timestamp: new Date().toISOString() },
        { id: '2', type: 'log', message: 'بدء تشغيل الجلسة الجديدة', timestamp: new Date(Date.now() - 50000).toISOString() },
        { id: '3', type: 'message', message: 'إرسال رد تلقائي لـ 966501234567', timestamp: new Date(Date.now() - 100000).toISOString() },
        { id: '4', type: 'status', message: 'محاولة إعادة اتصال...', timestamp: new Date(Date.now() - 500000).toISOString() },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'status': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'message': return <MessageSquare size={16} className="text-blue-500" />;
      case 'log': return <Info size={16} className="text-slate-400" />;
      default: return <Activity size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <History size={28} className="text-blue-600" />
            السجلات والرسائل
          </h1>
          <p className="text-slate-500 mt-1">تتبع نشاط البوت والرسائل الواردة في الوقت الفعلي</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          تحديث السجلات
        </button>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('messages')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'messages' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MessageSquare size={18} />
          آخر الرسائل
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'events' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Activity size={18} />
          أحدث الأحداث
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium">جاري جلب البيانات السحابية...</p>
          </div>
        ) : activeTab === 'messages' ? (
          <div className="divide-y divide-slate-50">
            {messages.length === 0 ? (
              <div className="p-10 text-center text-slate-400">لا توجد رسائل مستلمة حالياً</div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-sm">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800" dir="ltr">+{msg.from}</h4>
                      <p className="text-slate-600 mt-1 text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pr-16 md:pr-0">
                    <Clock size={14} />
                    {formatDate(msg.at)}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {events.length === 0 ? (
              <div className="p-10 text-center text-slate-400">لا توجد أحداث مسجلة حالياً</div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      {getEventIcon(event.type)}
                    </div>
                    <span className="text-slate-700 font-medium text-sm">{event.message}</span>
                  </div>
                  <span className="text-slate-400 text-xs font-medium shrink-0">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-slate-400 text-sm">يتم عرض آخر 50 رسالة و 200 حدث فقط</p>
      </div>
    </div>
  );
};
