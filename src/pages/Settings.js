import { useState } from 'react';
import PageLayout from '../components/PageLayout';
import Header from '../components/Header';
import Card from '../components/Card';
import SectionBlock from '../components/SectionBlock';
import FormField from '../components/FormField';
import SelectField from '../components/SelectField';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import ErrorToast from '../components/ErrorToast';

export default function Settings() {
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    businessName: '7-5 Inventory System',
    currency: 'RWF',
    timezone: 'Africa/Kigali',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    lowStockThreshold: 10,
    taxRate: 18
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    expiryAlerts: true,
    paymentReminders: true,
    salesReports: false,
    weeklyReports: true,
    monthlyReports: true
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    autoLogout: true
  });

  // Backup Settings
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupLocation: 'cloud',
    retentionPeriod: 30,
    lastBackup: '2024-01-15 14:30:00'
  });

  const handleSaveGeneral = () => {
    // Simulate saving
    console.log('Saving general settings:', generalSettings);
    setError('Settings saved successfully!');
    setTimeout(() => setError(''), 3000);
  };

  const handleSaveNotifications = () => {
    // Simulate saving
    console.log('Saving notification settings:', notificationSettings);
    setError('Notification settings saved successfully!');
    setTimeout(() => setError(''), 3000);
  };

  const handleSaveSecurity = () => {
    // Simulate saving
    console.log('Saving security settings:', securitySettings);
    setError('Security settings saved successfully!');
    setTimeout(() => setError(''), 3000);
  };

  const handleSaveBackup = () => {
    // Simulate saving
    console.log('Saving backup settings:', backupSettings);
    setError('Backup settings saved successfully!');
    setTimeout(() => setError(''), 3000);
  };

  const handleExportData = () => {
    // Simulate data export
    console.log('Exporting data...');
    setError('Data export initiated. You will receive an email when ready.');
    setTimeout(() => setError(''), 3000);
  };

  const handleImportData = () => {
    // Simulate data import
    console.log('Importing data...');
    setError('Data import initiated. Please wait for completion.');
    setTimeout(() => setError(''), 3000);
  };

  return (
    <>
      <ErrorToast error={error} onClose={() => setError('')} />
      <PageLayout mainId="settings-page" mainClassName="flex flex-col overflow-hidden">
        <Header
          title="Settings"
          subtitle="Manage your application preferences and configurations"
          right={
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-border-light rounded-lg text-text-secondary hover:bg-light-bg hover:text-text-primary transition-colors shadow-sm"
              >
                <i className="fa-solid fa-download" />
                <span>Export Data</span>
              </button>
              <button 
                onClick={handleImportData}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors shadow-sm"
              >
                <i className="fa-solid fa-upload" />
                <span>Import Data</span>
              </button>
            </div>
          }
        />

        {/* Tab Navigation */}
        <div className="bg-card-bg rounded-xl shadow-sm border border-border-light mb-6">
          <div className="flex border-b border-border-light">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <i className="fa-solid fa-cog mr-2"></i>
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <i className="fa-solid fa-bell mr-2"></i>
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'security'
                  ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <i className="fa-solid fa-shield-halved mr-2"></i>
              Security
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'backup'
                  ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <i className="fa-solid fa-database mr-2"></i>
              Backup & Data
            </button>
          </div>

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="p-6">
              <SectionBlock title="General Settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    id="businessName"
                    label="Business Name"
                    placeholder="Enter business name"
                    value={generalSettings.businessName}
                    onChange={(e) => setGeneralSettings({...generalSettings, businessName: e.target.value})}
                  />
                  <SelectField
                    id="currency"
                    label="Currency"
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                    options={[
                      { value: 'RWF', label: 'Rwandan Franc (RWF)' },
                      { value: 'USD', label: 'US Dollar (USD)' },
                      { value: 'EUR', label: 'Euro (EUR)' },
                      { value: 'GBP', label: 'British Pound (GBP)' }
                    ]}
                  />
                  <SelectField
                    id="timezone"
                    label="Timezone"
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                    options={[
                      { value: 'Africa/Kigali', label: 'Africa/Kigali' },
                      { value: 'UTC', label: 'UTC' },
                      { value: 'America/New_York', label: 'America/New_York' },
                      { value: 'Europe/London', label: 'Europe/London' }
                    ]}
                  />
                  <SelectField
                    id="language"
                    label="Language"
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'fr', label: 'Français' },
                      { value: 'sw', label: 'Kiswahili' },
                      { value: 'rw', label: 'Kinyarwanda' }
                    ]}
                  />
                  <SelectField
                    id="dateFormat"
                    label="Date Format"
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
                    options={[
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                    ]}
                  />
                  <FormField
                    id="lowStockThreshold"
                    label="Low Stock Threshold"
                    type="number"
                    placeholder="Enter threshold"
                    value={generalSettings.lowStockThreshold}
                    onChange={(e) => setGeneralSettings({...generalSettings, lowStockThreshold: parseInt(e.target.value)})}
                    inputProps={{ min: "1", step: "1" }}
                  />
                  <FormField
                    id="taxRate"
                    label="Tax Rate (%)"
                    type="number"
                    placeholder="Enter tax rate"
                    value={generalSettings.taxRate}
                    onChange={(e) => setGeneralSettings({...generalSettings, taxRate: parseInt(e.target.value)})}
                    inputProps={{ min: "0", max: "100", step: "1" }}
                  />
                </div>
                <div className="flex gap-3 pt-6">
                  <SecondaryButton onClick={() => setGeneralSettings({
                    businessName: '7-5 Inventory System',
                    currency: 'RWF',
                    timezone: 'Africa/Kigali',
                    language: 'en',
                    dateFormat: 'MM/DD/YYYY',
                    lowStockThreshold: 10,
                    taxRate: 18
                  })} className="flex-1">
                    <i className="fa-solid fa-undo mr-2"></i> Reset
                  </SecondaryButton>
                  <PrimaryButton onClick={handleSaveGeneral} className="flex-1">
                    <i className="fa-solid fa-save mr-2"></i> Save Changes
                  </PrimaryButton>
                </div>
              </SectionBlock>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <SectionBlock title="Notification Preferences">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-semibold text-text-primary mb-4">Email Notifications</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                          />
                          <span className="text-text-secondary">Enable email notifications</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.lowStockAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, lowStockAlerts: e.target.checked})}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                          />
                          <span className="text-text-secondary">Low stock alerts</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.expiryAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, expiryAlerts: e.target.checked})}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                          />
                          <span className="text-text-secondary">Expiry date alerts</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.paymentReminders}
                            onChange={(e) => setNotificationSettings({...notificationSettings, paymentReminders: e.target.checked})}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                          />
                          <span className="text-text-secondary">Payment reminders</span>
                        </label>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold text-text-primary mb-4">Reports</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.salesReports}
                            onChange={(e) => setNotificationSettings({...notificationSettings, salesReports: e.target.checked})}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                          />
                          <span className="text-text-secondary">Daily sales reports</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.weeklyReports}
                            onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked})}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                          />
                          <span className="text-text-secondary">Weekly summary reports</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={notificationSettings.monthlyReports}
                            onChange={(e) => setNotificationSettings({...notificationSettings, monthlyReports: e.target.checked})}
                            className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                          />
                          <span className="text-text-secondary">Monthly reports</span>
                        </label>
                      </div>
                    </Card>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <SecondaryButton onClick={() => setNotificationSettings({
                      emailNotifications: true,
                      lowStockAlerts: true,
                      expiryAlerts: true,
                      paymentReminders: true,
                      salesReports: false,
                      weeklyReports: true,
                      monthlyReports: true
                    })} className="flex-1">
                      <i className="fa-solid fa-undo mr-2"></i> Reset
                    </SecondaryButton>
                    <PrimaryButton onClick={handleSaveNotifications} className="flex-1">
                      <i className="fa-solid fa-save mr-2"></i> Save Changes
                    </PrimaryButton>
                  </div>
                </div>
              </SectionBlock>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="p-6">
              <SectionBlock title="Security Settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-semibold text-text-primary mb-4">Authentication</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorAuth}
                          onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
                          className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                        />
                        <span className="text-text-secondary">Enable Two-Factor Authentication</span>
                      </label>
                      <FormField
                        id="sessionTimeout"
                        label="Session Timeout (minutes)"
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                        inputProps={{ min: "5", max: "480", step: "5" }}
                      />
                      <FormField
                        id="passwordExpiry"
                        label="Password Expiry (days)"
                        type="number"
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                        inputProps={{ min: "30", max: "365", step: "1" }}
                      />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold text-text-primary mb-4">Access Control</h4>
                    <div className="space-y-4">
                      <FormField
                        id="loginAttempts"
                        label="Max Login Attempts"
                        type="number"
                        value={securitySettings.loginAttempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, loginAttempts: parseInt(e.target.value)})}
                        inputProps={{ min: "3", max: "10", step: "1" }}
                      />
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={securitySettings.autoLogout}
                          onChange={(e) => setSecuritySettings({...securitySettings, autoLogout: e.target.checked})}
                          className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                        />
                        <span className="text-text-secondary">Auto-logout on inactivity</span>
                      </label>
                    </div>
                  </Card>
                </div>
                <div className="flex gap-3 pt-6">
                  <SecondaryButton onClick={() => setSecuritySettings({
                    twoFactorAuth: false,
                    sessionTimeout: 30,
                    passwordExpiry: 90,
                    loginAttempts: 5,
                    autoLogout: true
                  })} className="flex-1">
                    <i className="fa-solid fa-undo mr-2"></i> Reset
                  </SecondaryButton>
                  <PrimaryButton onClick={handleSaveSecurity} className="flex-1">
                    <i className="fa-solid fa-save mr-2"></i> Save Changes
                  </PrimaryButton>
                </div>
              </SectionBlock>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="p-6">
              <SectionBlock title="Backup & Data Management">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-semibold text-text-primary mb-4">Backup Settings</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={backupSettings.autoBackup}
                          onChange={(e) => setBackupSettings({...backupSettings, autoBackup: e.target.checked})}
                          className="w-4 h-4 text-brand-blue bg-gray-100 border-gray-300 rounded focus:ring-brand-blue focus:ring-2"
                        />
                        <span className="text-text-secondary">Enable automatic backups</span>
                      </label>
                      <SelectField
                        id="backupFrequency"
                        label="Backup Frequency"
                        value={backupSettings.backupFrequency}
                        onChange={(e) => setBackupSettings({...backupSettings, backupFrequency: e.target.value})}
                        options={[
                          { value: 'daily', label: 'Daily' },
                          { value: 'weekly', label: 'Weekly' },
                          { value: 'monthly', label: 'Monthly' }
                        ]}
                      />
                      <SelectField
                        id="backupLocation"
                        label="Backup Location"
                        value={backupSettings.backupLocation}
                        onChange={(e) => setBackupSettings({...backupSettings, backupLocation: e.target.value})}
                        options={[
                          { value: 'cloud', label: 'Cloud Storage' },
                          { value: 'local', label: 'Local Storage' },
                          { value: 'both', label: 'Both Cloud & Local' }
                        ]}
                      />
                      <FormField
                        id="retentionPeriod"
                        label="Retention Period (days)"
                        type="number"
                        value={backupSettings.retentionPeriod}
                        onChange={(e) => setBackupSettings({...backupSettings, retentionPeriod: parseInt(e.target.value)})}
                        inputProps={{ min: "7", max: "365", step: "1" }}
                      />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold text-text-primary mb-4">Backup Status</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Last Backup</span>
                        <span className="font-semibold text-text-primary">{backupSettings.lastBackup}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Backup Size</span>
                        <span className="font-semibold text-text-primary">2.4 GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Status</span>
                        <span className="font-semibold text-status-green">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Next Backup</span>
                        <span className="font-semibold text-text-primary">Today 23:00</span>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="flex gap-3 pt-6">
                  <SecondaryButton onClick={() => setBackupSettings({
                    autoBackup: true,
                    backupFrequency: 'daily',
                    backupLocation: 'cloud',
                    retentionPeriod: 30,
                    lastBackup: '2024-01-15 14:30:00'
                  })} className="flex-1">
                    <i className="fa-solid fa-undo mr-2"></i> Reset
                  </SecondaryButton>
                  <PrimaryButton onClick={handleSaveBackup} className="flex-1">
                    <i className="fa-solid fa-save mr-2"></i> Save Changes
                  </PrimaryButton>
                </div>
              </SectionBlock>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  );
}

