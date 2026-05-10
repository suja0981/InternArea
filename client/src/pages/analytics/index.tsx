import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BarChart, Users, FileText, CheckCircle, Clock } from "lucide-react";

const Analytics = () => {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApplications: 0,
    approvedApplications: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) router.replace('/adminlogin');
  }, [router]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [usersRes, appsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/application`),
        ]);

        const users = usersRes.data;
        const applications = appsRes.data;

        const approved = applications.filter((app: any) => app.status === 'approved').length;
        const pending = applications.filter((app: any) => !app.status || app.status === 'pending').length;

        setStats({
          totalUsers: users.length,
          totalApplications: applications.length,
          approvedApplications: approved,
          pendingApplications: pending,
        });
      } catch (error) {
        console.error("Error fetching analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of platform metrics and performance</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading Analytics...</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.totalApplications}</dd>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.approvedApplications}</dd>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.pendingApplications}</dd>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
