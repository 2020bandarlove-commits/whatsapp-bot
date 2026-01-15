
import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  QrCode, 
  Key, 
  Send, 
  Clock, 
  Copy, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { BotStatus, PairingData } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<BotStatus>(BotStatus.CONNECTING);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString('ar-EG'));
  const [pairingData, setPairingData] = useState<PairingData>({ pairingCode: null, qrPngBase64: null });
  const [activeTab, setActiveTab] = useState<'qr' | 'pairing'>('qr');
  const [testMsg, setTestMsg] = useState({ to: '', text: '' });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
    // Simulate SSE or long polling for demo
    const interval = setInterval(() => {
      setLastUpdate(new Date().toLocaleTimeString('ar-EG'));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    try {
      // Real API calls would go here
      // const statusData = await api.get('/status');
      // const qrData = await api.get('/qr');
      // const pairData = await api.get('/pairing');

      // Mock Data for illustration
      setStatus(BotStatus.DISCONNECTED);
      setPairingData({
        pairingCode: 'XYZ4-5678',
        qrPngBase64: 'https://picsum.photos/seed/qr/300/300' // Placeholder image
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('هل أنت متأكد من إعادة تعيين الجلسة؟ سيتم فصل البوت الحالي.')) return;
    try {
      await api.post('/session/reset', {});
      fetchInitialData();
    } catch (err) {
      alert('فشل إعادة تعيين الجلسة');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم النسخ!');
  };

  const sendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    try {
      // await api.post('/send', testMsg);
      await new Promise(res => setTimeout(res, 1000));
      setSendResult({ type: 'success', msg: 'تم إرسال الرسالة بنجاح' });
      setTestMsg({ ...testMsg, text: '' });
    } catch (err) {
      setSendResult({ type: 'error', msg: 'فشل إرسال الرسالة' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Section: Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">حالة البوت</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border ${STATUS_COLORS[status]}`}>
              {status === BotStatus.CONNECTING && <RefreshCw size={14} className="animate-spin" />}
              {status === BotStatus.CONNECTED && <Wifi size={14} />}
              {status === BotStatus.DISCONNECTED && <WifiOff size={14} />}
              {STATUS_LABELS[status]}
            </div>
          </div>
          <div className={`p-4 rounded-2xl ${status === BotStatus.CONNECTED ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <Wifi size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">آخر تحديث</p>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              {lastUpdate}
            </h3>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <RefreshCw size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
          <button 
            onClick={handleReset}
            className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            إعادة ربط البوت
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <QrCode size={20} className="text-blue-600" />
                ربط واتساب
              </h2>
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('qr')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'qr' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  رمز QR
                </button>
                <button 
                  onClick={() => setActiveTab('pairing')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'pairing' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  كود الربط
                </button>
              </div>
            </div>

            <div className="p-10 flex flex-col items-center justify-center min-h-[350px]">
              {activeTab === 'qr' ? (
                pairingData.qrPngBase64 ? (
                  <div className="space-y-6 text-center">
                    <div className="p-4 bg-white border-4 border-slate-50 rounded-3xl shadow-inner inline-block">
                      <img src={pairingData.qrPngBase64} alt="WhatsApp QR Code" className="w-64 h-64 rounded-xl" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                      افتح واتساب على هاتفك، اذهب إلى الإعدادات {'>'} الأجهزة المرتبطة {'>'} ربط جهاز
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Loader2 className="animate-spin text-blue-600 mb-4 mx-auto" size={48} />
                    <p className="text-slate-500 font-medium">جاري إنشاء رمز QR...</p>
                  </div>
                )
              ) : (
                <div className="space-y-8 text-center w-full max-w-sm">
                  {pairingData.pairingCode ? (
                    <>
                      <div className="space-y-3">
                        <p className="text-slate-500 text-sm font-medium">كود الربط الخاص بك</p>
                        <div className="flex items-center justify-center gap-4">
                          <span className="text-4xl font-black tracking-widest text-blue-600 bg-blue-50 px-8 py-4 rounded-2xl border border-blue-100">
                            {pairingData.pairingCode}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(pairingData.pairingCode!)}
                            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
                          >
                            <Copy size={24} />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        استخدم هذا الكود عند اختيار "ربط باستخدام رقم الهاتف" في واتساب.
                      </p>
                    </>
                  ) : (
                    <div className="py-12">
                      <Loader2 className="animate-spin text-blue-600 mb-4 mx-auto" size={48} />
                      <p className="text-slate-500 font-medium">جاري جلب كود الربط...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Message Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Send size={20} className="text-green-600" />
                إرسال رسالة تجريبية
              </h2>
            </div>
            
            <div className="p-6 flex-1">
              <form onSubmit={sendTestMessage} className="space-y-5">
                {sendResult && (
                  <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2 ${sendResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {sendResult.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {sendResult.msg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block mr-1">رقم الواتساب</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={testMsg.to}
                    onChange={(e) => setTestMsg({ ...testMsg, to: e.target.value })}
                    placeholder="966500000000"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mr-1">الصيغة الدولية بدون (+) أو (00)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block mr-1">نص الرسالة</label>
                  <textarea
                    rows={4}
                    required
                    value={testMsg.text}
                    onChange={(e) => setTestMsg({ ...testMsg, text: e.target.value })}
                    placeholder="اكتب هنا رسالتك التجريبية..."
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  إرسال الآن
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <RefreshCw className={className} size={size} />
);
