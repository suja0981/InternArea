import React, { useEffect } from "react";
import { Settings, Save, Shield, Bell } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AdminSettings = () => {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) router.replace('/adminlogin');
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, POST the settings to the server
    toast.success("Settings saved successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage system preferences and configurations.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSave} className="divide-y divide-gray-200">
            {/* General Settings */}
            <div className="p-6">
              <div className="flex items-center mb-4 text-lg font-medium text-gray-900">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                General Settings
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Platform Name</label>
                  <input
                    type="text"
                    defaultValue="Smart Waste Management"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Support Email</label>
                  <input
                    type="email"
                    defaultValue="support@internshala-clone.com"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
              </div>
            </div>

            {/* Application Settings */}
            <div className="p-6">
              <div className="flex items-center mb-4 text-lg font-medium text-gray-900">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Security & Limits
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Free Tier Monthly App Limit</label>
                  <input
                    type="number"
                    defaultValue={1}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enforce Chrome OTP Verification
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enforce Mobile Time Limits (10AM - 1PM)
                  </label>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="p-6">
              <div className="flex items-center mb-4 text-lg font-medium text-gray-900">
                <Bell className="h-5 w-5 mr-2 text-yellow-600" />
                Notifications
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">New Application Alerts</h4>
                    <p className="text-sm text-gray-500">Receive an email when a user applies for a job.</p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Daily Digest</h4>
                    <p className="text-sm text-gray-500">Receive a daily summary of platform activity.</p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end">
              <button
                type="button"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2 mt-0.5" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
