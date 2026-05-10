import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
interface User {
  name: string;
  email: string;
  photo: string;
}
const index = () => {
  // const [user, setuser] = useState<User | null>({
  //   name: "Rahul",
  //   email: "xyz@gmail.com",
  //   photo:
  //     "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces",
  // });
  const user = useSelector(selectuser);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [appStats, setAppStats] = useState({ active: 0, accepted: 0 });

  React.useEffect(() => {
    const fetchHistory = async () => {
      if (user?.uid) {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/history/${user.uid}`, {
            headers: { 'x-requesting-uid': user.uid }
          });
          setLoginHistory(res.data);
        } catch (error) {
          console.error("Failed to fetch login history", error);
        }
      }
    };
    fetchHistory();

    const fetchAppStats = async () => {
      if (user?.uid) {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/application`);
          const userApps = res.data.filter((app: any) => app.user?.uid === user.uid);
          const accepted = userApps.filter((app: any) => app.status === 'approved').length;
          setAppStats({ active: userApps.length, accepted });
        } catch (error) {
          console.error("Failed to fetch application stats", error);
        }
      }
    };
    fetchAppStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {appStats.active}
                  </span>
                  <p className="text-blue-600 text-sm mt-1">
                    Total Applications
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">
                    {appStats.accepted}
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    Accepted Applications
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Applications
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Login History Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Login Activity</h3>
            <p className="mt-1 text-sm text-gray-500">Security log of devices accessing your account.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Browser</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device / OS</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loginHistory.map((record) => (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {record.browser}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.deviceType} / {record.os}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'Success' || record.status === 'OTP Verified' ? 'bg-green-100 text-green-800' : 
                        record.status === 'Pending OTP' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {loginHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No recent login activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;