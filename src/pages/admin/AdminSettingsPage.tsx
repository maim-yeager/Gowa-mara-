import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { AppSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../../services/firebase';
import { recordAdminLog } from '../../services/adminLogService';
import { APP_CONFIG } from '../../config/appConfig';
import { Sliders, Check, AlertCircle, Save } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    registrationEnabled: true,
    approvalRequired: true,
    maxUploadSizeMb: 10,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    sharingEnabled: false,
    maintenanceMode: false,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'app_config')).then((docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    }).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      const updated = {
        ...settings,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'settings', 'app_config'), updated, { merge: true });
      await recordAdminLog(
        currentUser.uid,
        currentUser.email || 'Admin',
        'settings_updated',
        'settings',
        'app_config',
        'Updated platform configuration settings'
      );
      setSuccessMsg('Platform settings saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Save settings error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout currentTab="settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Platform Policy & Controls</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure registration requirements, upload limits, and security enforcement.
          </p>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 border border-white/10 space-y-6 shadow-2xl">
          <div className="space-y-4">
            {/* Approval Requirement */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white">Require Admin Approval to Publish</h4>
                <p className="text-xs text-slate-400">
                  When enabled, all new registrations remain "pending" until manually approved by an admin.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.approvalRequired}
                onChange={(e) => setSettings({ ...settings, approvalRequired: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-slate-800 border-white/10"
              />
            </div>

            {/* Registration Open */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white">Allow Public Registration</h4>
                <p className="text-xs text-slate-400">
                  Allow new users to sign up via Email or Google provider.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-slate-800 border-white/10"
              />
            </div>

            {/* Public Sharing Feature */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white">Enable Public Share URLs (/p/:id)</h4>
                <p className="text-xs text-slate-400">
                  Allow creators to generate publicly accessible link sharing for approved public posts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.sharingEnabled}
                onChange={(e) => setSettings({ ...settings, sharingEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-slate-800 border-white/10"
              />
            </div>

            {/* Maintenance Mode */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div>
                <h4 className="text-sm font-bold text-rose-300">Maintenance Mode</h4>
                <p className="text-xs text-rose-200/80">
                  Temporarily pause normal user operations for scheduled database maintenance.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded text-rose-500 bg-slate-800 border-white/10"
              />
            </div>

            {/* Max Upload Size */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Maximum Upload File Size (MB)</span>
                <span className="font-mono text-amber-300 font-bold">{settings.maxUploadSizeMb} MB</span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                step={1}
                value={settings.maxUploadSizeMb}
                onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: parseInt(e.target.value) || 10 })}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
