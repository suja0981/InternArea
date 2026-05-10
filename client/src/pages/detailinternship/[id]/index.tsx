import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
// export const internships = [
//   {
//     _id: "1",
//     title: "Frontend Developer Intern",
//     company: "Tech Innovators",
//     location: "Remote",
//     stipend: "$500/month",
//     Duration: "3 Months",
//     StartDate: "March 15, 2025",
//     aboutCompany:
//       "Tech Innovators is a leading software development company specializing in modern web applications.",
//     aboutJob:
//       "As a Frontend Developer Intern, you will work on real-world projects using React.js and Tailwind CSS.",
//     Whocanapply:
//       "Students and fresh graduates with knowledge of HTML, CSS, JavaScript, and React.js.",
//     perks: "Certificate, Letter of Recommendation, Flexible Work Hours",
//     AdditionalInfo: "This is a remote internship with flexible working hours.",
//     numberOfopning: "2",
//   },
//   {
//     _id: "2",
//     title: "Backend Developer Intern",
//     company: "Cloud Systems",
//     location: "San Francisco",
//     stipend: "$800/month",
//     Duration: "4 Months",
//     StartDate: "April 1, 2025",
//     aboutCompany:
//       "Cloud Systems focuses on scalable backend solutions and cloud-based applications.",
//     aboutJob:
//       "As a Backend Developer Intern, you will work with Node.js, Express, and MongoDB.",
//     Whocanapply:
//       "Students with experience in backend technologies and databases.",
//     perks: "Certificate, Networking Opportunities, Paid Internship",
//     AdditionalInfo: "A strong foundation in databases is required.",
//     numberOfopning: "3",
//   },
//   {
//     _id: "3",
//     title: "UI/UX Designer Intern",
//     company: "Creative Minds",
//     location: "New York",
//     stipend: "$600/month",
//     Duration: "6 Months",
//     StartDate: "May 10, 2025",
//     aboutCompany:
//       "Creative Minds is a design agency focused on user experience and interface design.",
//     aboutJob:
//       "As a UI/UX Designer Intern, you will work with Figma, Adobe XD, and design systems.",
//     Whocanapply:
//       "Students passionate about designing intuitive user experiences.",
//     perks: "Mentorship, Hands-on Projects, Letter of Recommendation",
//     AdditionalInfo: "A portfolio is required for application.",
//     numberOfopning: "1",
//   },
// ];

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [internshipData, setinternship] = useState<any>(null)
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/internship/${id}`)
        setinternship(res.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchdata()
  }, [id])
  const [availability, setAvailability] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const user = useSelector(selectuser)
  if (!internshipData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 relative z-0">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden mb-12 animate-pulse">
          {/* Header Skeleton */}
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <div className="h-6 w-32 bg-gray-200 rounded-full mb-6"></div>
            <div className="h-10 w-3/4 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-6 w-1/2 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="h-16 bg-gray-200 rounded-xl"></div>
              <div className="h-16 bg-gray-200 rounded-xl"></div>
              <div className="h-16 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-6 w-48 bg-gray-200 rounded-lg"></div>
          </div>
          {/* Content Skeletons */}
          <div className="p-8 border-b border-gray-100">
            <div className="h-8 w-48 bg-gray-200 rounded-lg mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
          <div className="p-8">
            <div className="h-8 w-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="space-y-3 mb-8">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const handlesubmitapplication = async () => {
    if (!coverLetter.trim()) {
      toast.error("please write a cover letter")
      return
    }
    if (!availability) {
      toast.error("please select your availability")
      return
    }
    try {
      const applicationdata = {
        category: internshipData.category,
        company: internshipData.company,
        coverLetter: coverLetter,
        user: user,
        Application: id,
        availability
      }
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/application`, applicationdata)
      toast.success("Application submit successfully")
      router.push('/internship')
    } catch (error: any) {
      console.error(error)
      if (error.response?.status === 403 && error.response?.data?.error === "Limit_Exceeded") {
        toast.error(error.response.data.message);
        router.push('/pricing');
      } else {
        toast.error(error.response?.data?.message || "Failed to submit application");
      }
    }
  }
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 relative z-0">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden mb-12 animate-fade-in-up">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 bg-gradient-to-b from-primary-50/50 to-white">
          <div className="flex items-center space-x-2 text-primary-600 mb-4 bg-primary-100/50 w-fit px-3 py-1.5 rounded-full text-sm font-semibold">
            <ArrowUpRight className="h-5 w-5" />
            <span>Actively Hiring</span>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {internshipData.title}
          </h1>
          <p className="text-xl text-gray-500 font-medium mb-6">{internshipData.company}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-4 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm"><MapPin className="h-5 w-5 text-primary-500" /></div>
              <span className="font-medium">{internshipData.location}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-4 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm"><DollarSign className="h-5 w-5 text-green-500" /></div>
              <span className="font-medium">{internshipData.stipend}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600 bg-gray-50 p-4 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm"><Calendar className="h-5 w-5 text-orange-500" /></div>
              <span className="font-medium">{internshipData.startDate}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-2 bg-green-50 w-fit px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-green-600 text-sm font-medium">
              Posted on {internshipData.createdAt}
            </span>
          </div>
        </div>
        {/* Company Section */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About {internshipData.company}
          </h2>
          <div className="flex items-center space-x-2 mb-4">
            <a
              href="#"
              className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 font-medium group"
            >
              <span>Visit company website</span>
              <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
          <p className="text-gray-600 leading-relaxed">{internshipData.aboutCompany}</p>
        </div>
        {/* Internship Details Section */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About the Internship
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{internshipData.aboutInternship}</p>

          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Who can apply
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed bg-gray-50 p-4 rounded-xl">{internshipData.whoCanApply}</p>

          <h3 className="text-lg font-bold text-gray-900 mb-3">Perks</h3>
          <p className="text-gray-600 mb-8 leading-relaxed flex items-center gap-2">
            <span className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">{internshipData.perks}</span>
          </p>

          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Additional Information
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">{internshipData.additionalInfo}</p>

          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Number of Openings
          </h3>
          <p className="text-gray-600 font-medium">{internshipData.numberOfOpening}</p>
        </div>
        {/* Apply Button */}
        <div className="p-8 flex justify-center bg-gray-50">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 text-white px-10 py-3.5 rounded-xl hover:bg-primary-700 transition-all duration-300 font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 text-lg w-full md:w-auto"
          >
            Apply Now
          </button>
        </div>
      </div>
      {/* Apply Modal */}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6 border-b border-gray-100/50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Apply to {internshipData.company}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-8">
              {/* Resume Section */}
              <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Your Resume
                </h3>
                <p className="text-primary-700 font-medium">
                  Your current resume will be submitted with the application
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Cover Letter
                </h3>
                <p className="text-gray-500 mb-4 text-sm font-medium">
                  Why should you be selected for this internship?
                </p>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 resize-none transition-shadow"
                  placeholder="Write your cover letter here..."
                ></textarea>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Your Availability
                </h3>
                <div className="space-y-4">
                    {[
                        "Yes, I am available to join immediately",
                        "No, I am currently on notice period",
                        "No, I will have to serve notice period",
                        "Other",
                      ].map((option) => (
                        <label key={option} className="flex items-start space-x-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="availability"
                            id={`avail-${option}`}
                            value={option}
                            checked={availability === option}
                            onChange={(e) => setAvailability(e.target.value)}
                            className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                          />
                          <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{option}</span>
                        </label>
                      ))}
                </div>
              </div>
              <div className="flex justify-end pt-6 border-t border-gray-100">
                {user ? (
                  <button className="bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5" onClick={handlesubmitapplication}>
                    Submit Application
                  </button>
                ) : (
                  <Link
                    href={`/`}
                    className="bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 transition-all font-bold shadow-md"
                  >
                    Sign up to apply
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;