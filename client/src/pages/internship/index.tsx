import axios from "axios";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Pin,
  PlayCircle,
  Pointer,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
// const internshipData = [
//   {
//     _id: "1",
//     title: "Frontend Developer Intern",
//     company: "TechCorp",
//     StartDate: "April 2025",
//     Duration: "3 Months",
//     stipend: "$500/month",
//     category: "Web Development",
//     location: "New York",
//   },
//   {
//     _id: "2",
//     title: "Data Science Intern",
//     company: "DataTech",
//     StartDate: "May 2025",
//     Duration: "6 Months",
//     stipend: "$800/month",
//     category: "Data Science",
//     location: "San Francisco",
//   },
//   {
//     _id: "3",
//     title: "Marketing Intern",
//     company: "MarketPro",
//     StartDate: "June 2025",
//     Duration: "4 Months",
//     stipend: "$400/month",
//     category: "Marketing",
//     location: "Los Angeles",
//   },
// ];
const index = () => {
  const [filteredInternships, setfilteredInternships] = useState<any>([]);
  const [isFiltervisible, setisFiltervisible] = useState(false);
  const [filter, setfilters] = useState({
    category: "",
    location: "",
    workFromHome: false,
    partTime: false,
    stipend: 50,
  });
  const [internshipData, setinternship] = useState<any>([])
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/internship`)
        setinternship(res.data)
        setfilteredInternships(res.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchdata()
  }, [])
  useEffect(() => {
    const filtered = internshipData.filter((internship: any) => {
      const matchesCategory = internship.category
        .toLowerCase()
        .includes(filter.category.toLowerCase());
      const matchesLocation = internship.location
        .toLowerCase()
        .includes(filter.location.toLowerCase());
      return matchesCategory && matchesLocation;
    });
    setfilteredInternships(filtered);
  }, [filter, internshipData]);
  const handlefilterchange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setfilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const clearFilters = () => {
    setfilters({
      category: "",
      location: "",
      workFromHome: false,
      partTime: false,
      stipend: 50,
    });
    setfilteredInternships(internshipData);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filter  */}
          <div className="hidden md:block w-72 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 h-fit sticky top-24 z-10">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-primary-600" />
                <span className="font-bold text-gray-900 text-lg">Filters</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-6">
              {/* Profile/Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={filter.category}
                  onChange={handlefilterchange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 transition-all"
                  placeholder="e.g. Marketing"
                />
              </div>
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filter.location}
                  onChange={handlefilterchange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 transition-all"
                  placeholder="e.g. Mumbai"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-4 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="workFromHome"
                    checked={filter.workFromHome}
                    onChange={handlefilterchange}
                    className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 accent-primary-600 transition-all"
                  />
                  <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Work from home</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="partTime"
                    checked={filter.partTime}
                    onChange={handlefilterchange}
                    className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 accent-primary-600 transition-all"
                  />
                  <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">Part-time</span>
                </label>
              </div>

              {/* Stipend Range */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Monthly Stipend (₹)
                </label>
                <input
                  type="range"
                  name="stipend"
                  min="0"
                  max="100"
                  value={filter.stipend}
                  onChange={handlefilterchange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
                  <span>₹0</span>
                  <span>₹50K</span>
                  <span>₹100K</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="md:hidden mb-6">
              <button
                onClick={() => setisFiltervisible(!isFiltervisible)}
                className="w-full flex items-center justify-center space-x-2 bg-white py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] border border-gray-100 text-gray-800 font-bold hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5 text-primary-600" />
                <span> Show Filters</span>
              </button>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-[0_4px_14px_0_rgba(0,0,0,0.02)] border border-gray-100 mb-6 flex justify-between items-center">
              <p className="font-bold text-gray-800">
                <span className="text-primary-600">{filteredInternships.length}</span> Internships found
              </p>
            </div>
            <div className="space-y-6">
              {filteredInternships.map((internship: any) => (
                <div
                  key={internship._id}
                  className="group bg-white rounded-2xl border border-gray-100 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                >
                  <div className="flex items-center space-x-2 text-primary-600 mb-4 bg-primary-50 w-fit px-3 py-1.5 rounded-full text-sm font-semibold">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Actively Hiring</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {internship.title}
                  </h2>
                  <p className="text-gray-500 font-medium mb-6">{internship.company}</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <PlayCircle className="h-5 w-5 text-primary-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</p>
                        <p className="font-medium text-gray-800">{internship.startDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Pin className="h-5 w-5 text-primary-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</p>
                        <p className="font-medium text-gray-800">{internship.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <DollarSign className="h-5 w-5 text-primary-400" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stipend</p>
                        <p className="font-medium text-gray-800">{internship.stipend}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        Internship
                      </span>
                      <div className="hidden sm:flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">Posted recently</span>
                      </div>
                    </div>
                    <Link
                      href={`/detailinternship/${internship._id}`}
                      className="text-primary-600 hover:text-white border border-primary-600 hover:bg-primary-600 font-semibold px-6 py-2.5 rounded-xl transition-colors duration-300"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Filters Modal */}
      {isFiltervisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white h-full w-full max-w-sm ml-auto p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                onClick={() => setisFiltervisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              {/* Profile/Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={filter.category}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
                  placeholder="e.g. Marketing Intern"
                />
              </div>
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filter.location}
                  onChange={handlefilterchange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
                  placeholder="e.g. Mumbai"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="workFromHome"
                    checked={filter.workFromHome}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded "
                  />
                  <span className="text-gray-700">Work from home</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="partTime"
                    checked={filter.partTime}
                    onChange={handlefilterchange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Part-time</span>
                </label>
              </div>

              {/* Stipend Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Stipend (₹)
                </label>
                <input
                  type="range"
                  name="stipend"
                  min="0"
                  max="100"
                  value={filter.stipend}
                  onChange={handlefilterchange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₹0</span>
                  <span>₹50K</span>
                  <span>₹100K</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default index;