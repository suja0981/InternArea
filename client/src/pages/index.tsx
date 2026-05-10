import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronRight,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function SvgSlider() {
  const categories = [
    "Big Brands",
    "Work From Home",
    "Part-time",
    "MBA",
    "Engineering",
    "Media",
    "Design",
    "Data Science",
  ];
  // const internships = [
  //   {
  //     _id: "1",
  //     title: "Software Engineering Intern",
  //     company: "Google",
  //     location: "Remote",
  //     stipend: "$1,500/month",
  //     duration: "3 months",
  //     category: "Engineering",
  //   },
  //   {
  //     _id: "2",
  //     title: "Marketing Intern",
  //     company: "Meta",
  //     location: "New York",
  //     stipend: "$1,200/month",
  //     duration: "6 months",
  //     category: "Media",
  //   },
  //   {
  //     _id: "3",
  //     title: "Graphic Design Intern",
  //     company: "Adobe",
  //     location: "San Francisco",
  //     stipend: "$1,000/month",
  //     duration: "4 months",
  //     category: "Design",
  //   },
  // ];

  // const jobs = [
  //   {
  //     _id: "101",
  //     title: "Frontend Developer",
  //     company: "Amazon",
  //     location: "Seattle",
  //     CTC: "$100K/year",
  //     Experience: "2+ years",
  //     category: "Engineering",
  //   },
  //   {
  //     _id: "102",
  //     title: "Data Analyst",
  //     company: "Microsoft",
  //     location: "Remote",
  //     CTC: "$90K/year",
  //     Experience: "1+ years",
  //     category: "Data Science",
  //   },
  //   {
  //     _id: "103",
  //     title: "UX Designer",
  //     company: "Apple",
  //     location: "California",
  //     CTC: "$110K/year",
  //     Experience: "3+ years",
  //     category: "Design",
  //   },
  // ];
  const slides = [
    {
      pattern: "pattern-1",
      title: "Start Your Career Journey",
      bgColor: "bg-gradient-to-r from-primary-600 to-indigo-600",
    },
    {
      pattern: "pattern-2",
      title: "Learn From The Best",
      bgColor: "bg-gradient-to-r from-blue-600 to-cyan-600",
    },
    {
      pattern: "pattern-3",
      title: "Grow Your Skills",
      bgColor: "bg-gradient-to-r from-purple-600 to-pink-600",
    },
    {
      pattern: "pattern-4",
      title: "Connect With Top Companies",
      bgColor: "bg-gradient-to-r from-teal-500 to-emerald-600",
    },
  ];


  const [internships, setinternship] = useState<any>([]);
  const [jobs, setjob] = useState<any>([]);
  const [stats, setstats] = useState([
    { number: "...", label: "companies & students" },
    { number: "...", label: "open job listings" },
    { number: "...", label: "internship opportunities" },
    { number: "...", label: "registered users" },
  ]);
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const [internshipres, jobres, usersRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/internship`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/job`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users`),
        ]);
        setinternship(internshipres.data);
        setjob(jobres.data);
        setstats([
          { number: `${usersRes.data.length + jobres.data.length + internshipres.data.length}+`, label: "companies & students" },
          { number: `${jobres.data.length}`, label: "open job listings" },
          { number: `${internshipres.data.length}`, label: "internship opportunities" },
          { number: `${usersRes.data.length}`, label: "registered users" },
        ]);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, []);
  const [selectedCategory, setSelectedCategory] = useState("");
  const filteredInternships = internships.filter(
    (item: any) => !selectedCategory || item.category === selectedCategory
  );
  const filteredJobs = jobs.filter(
    (item: any) => !selectedCategory || item.category === selectedCategory
  );
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-0">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-200/40 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      {/* hero section */}
      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-primary-700 mb-6 tracking-tight">
          Make your dream career a reality
        </h1>
        <p className="text-xl text-gray-500 font-medium">Trending on InternArea 🔥</p>
      </div>
      {/* Swiper section */}
      <div className="mb-16">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000 }}
          className="rounded-xl overflow-hidden shadow-lg"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className={`relative h-[400px] ${slide.bgColor} flex items-center justify-center`}>
                {/* SVG Pattern Background */}
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id={`p-${slide.pattern}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <g transform="translate(18,18)" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          {slide.pattern === "pattern-1" && (
                            <>
                              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                            </>
                          )}
                          {slide.pattern === "pattern-2" && (
                            <>
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                            </>
                          )}
                          {slide.pattern === "pattern-3" && (
                            <>
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                              <polyline points="16 7 22 7 22 13"/>
                            </>
                          )}
                          {slide.pattern === "pattern-4" && (
                            <>
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </>
                          )}
                        </g>
                      </pattern>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" fill={`url(#p-${slide.pattern})`} />
                  </svg>
                </div>
                {/* Content */}
                <div className="relative z-10 text-center px-6">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <p className="mt-4 text-lg text-white/80">Find your perfect opportunity today.</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {/* Category section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Latest internships on Intern Area
        </h2>
        <div className="flex flex-wrap gap-4">
          <span className="text-gray-700 font-medium">POPULAR CATEGORIES:</span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCategory === category
                ? "bg-primary-600 text-white shadow-md shadow-primary-600/30 -translate-y-0.5"
                : "bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600 border border-gray-200"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      {/* INternship grid   */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {filteredInternships.map((internship: any, index: any) => (
          <div
            key={index}
            className="group bg-white rounded-2xl border border-gray-100 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col h-full"
          >
            <div className="flex items-center gap-2 text-primary-600 mb-5 bg-primary-50 w-fit px-3 py-1.5 rounded-full text-sm font-medium">
              <ArrowUpRight size={16} />
              <span>Actively Hiring</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
              {internship.title}
            </h3>
            <p className="text-gray-500 mb-6 font-medium">{internship.company}</p>
            <div className="space-y-4 text-gray-600 mb-8 flex-1">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                <span className="font-medium">{internship.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Banknote size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                <span className="font-medium">{internship.stipend}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                <span className="font-medium">{internship.duration}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
              <span className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                Internship
              </span>
              <Link
                href={`/detailinternship/${internship._id}`}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold group/link"
              >
                View details
                <ChevronRight size={16} className="transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      {/* Jobs grid   */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Jobs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredJobs.map((job: any, index: any) => (
            <div
              key={index}
              className="group bg-white rounded-2xl border border-gray-100 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col h-full"
            >
              <div className="flex items-center gap-2 text-primary-600 mb-5 bg-primary-50 w-fit px-3 py-1.5 rounded-full text-sm font-medium">
                <ArrowUpRight size={16} />
                <span>Actively Hiring</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-gray-500 mb-6 font-medium">{job.company}</p>
              <div className="space-y-4 text-gray-600 mb-8 flex-1">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <span className="font-medium">{job.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Banknote size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                  <span className="font-medium">{job.CTC}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <span className="font-medium">{job.Experience}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Jobs
                </span>
                <Link
                  href={`/detailjob/${job._id}`}
                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold group/link"
                >
                  View details
                  <ChevronRight size={16} className="transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Stat Section  */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-10 mb-20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-indigo-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                {stat.number}
              </div>
              <div className="text-gray-500 font-medium uppercase text-xs tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}