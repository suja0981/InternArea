import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth, storage } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileText, Upload, Lock, Briefcase, GraduationCap, User as UserIcon, Check, AlertTriangle, Clock } from 'lucide-react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Compute how many minutes until the 10 AM IST window opens
function getMinutesUntilWindow(): number {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const h = ist.getHours();
  const m = ist.getMinutes();

  if (h === 10) return 0; // currently open
  let minutesUntil = ((10 - h - 1) * 60) + (60 - m);
  if (minutesUntil < 0) minutesUntil += 24 * 60; // next day
  return minutesUntil;
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'now';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ResumeBuilder() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [dbUser, setDbUser] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isTimeValid, setIsTimeValid] = useState(false);
    const [minutesUntil, setMinutesUntil] = useState(0);

    // Form Data
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        qualifications: '',
        experience: '',
        personalInfo: ''
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');
    const [otp, setOtp] = useState('');
    const [existingResume, setExistingResume] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName,
                        email: currentUser.email,
                        photoURL: currentUser.photoURL
                    });
                    setDbUser(res.data);
                    
                    // Fetch existing resume if any
                    const resumeRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/${currentUser.uid}`);
                    if (resumeRes.data) {
                        setExistingResume(resumeRes.data);
                        setStep(5); // Go directly to preview if already generated
                    }
                } catch (error: any) {
                    // Ignore 404 meaning no resume yet
                    if (error.response?.status !== 404) {
                        console.error("Error fetching data", error);
                    }
                }
            } else {
                router.push('/');
            }
        });

        // Time check logic
        const updateTime = () => {
            const mins = getMinutesUntilWindow();
            setIsTimeValid(mins === 0);
            setMinutesUntil(mins);
        };
        updateTime();
        const interval = setInterval(updateTime, 30000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [router]);

    if (!dbUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

    if (dbUser.plan === 'Free') {
        return (
            <div className="max-w-3xl mx-auto py-20 px-6 text-center">
                <Lock className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Premium Feature Locked</h1>
                <p className="text-lg text-gray-600 mb-8">
                    The Professional Resume Builder is an exclusive feature for our Premium members (Bronze, Silver, or Gold).
                </p>
                <button 
                    onClick={() => router.push('/pricing')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Upgrade to Premium
                </button>
            </div>
        );
    }

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = (e: any) => {
        if (e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleGenerateOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isTimeValid) {
            toast.error("Resume generation is only available between 10:00 AM and 11:00 AM IST.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/send-otp`, { uid: user.uid });
            toast.success(res.data.message);
            setStep(2);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to send OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndPay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return toast.error("Enter OTP");
        if (!isTimeValid) return toast.error("Payment window is closed.");
        
        setIsLoading(true);

        try {
            // 1. Verify OTP & Order
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/verify-and-order`, { 
                uid: user.uid, 
                otp 
            });
            const { order } = res.data;

            // 2. Upload Photo FIRST before payment to prevent payment loss on upload fail
            let photoUrl = '';
            if (photoFile) {
                toast.info("Uploading photo, please wait...");
                const storageRef = ref(storage, `resumes/${user.uid}/${Date.now()}_${photoFile.name}`);
                await uploadBytes(storageRef, photoFile);
                photoUrl = await getDownloadURL(storageRef);
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
                amount: order.amount,
                currency: order.currency,
                name: 'Intern Area',
                description: `Professional Resume Generation (₹50)`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature || 'mock_signature',
                            uid: user.uid,
                            resumeData: { ...formData, photoUrl }
                        });
                        
                        toast.success(verifyRes.data.message);
                        setExistingResume(verifyRes.data.resume);
                        setStep(5);
                    } catch (err: any) {
                        toast.error(err.response?.data?.error || "Error saving resume to database. Please contact support.");
                    }
                },
                prefill: {
                    name: formData.fullName || user.displayName || 'User',
                    email: formData.email || user.email || 'user@example.com'
                },
                theme: { color: '#2563EB' },
                modal: {
                    ondismiss: () => toast.info('Payment cancelled.')
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Verification or Upload failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <Head>
                <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
            </Head>

            {step < 5 && (
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Professional Resume Builder</h1>
                    <p className="mt-2 text-gray-600 mb-6">Enter your details to generate a stunning resume instantly. Fee: ₹50</p>
                    
                    {!isTimeValid && (
                        <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 px-6 py-4 rounded-xl text-sm font-medium shadow-sm mb-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                                <span>Payments are only available <strong>10:00 AM – 11:00 AM IST</strong></span>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-lg">
                                <Clock size={14} />
                                <span>Opens in ~{formatCountdown(minutesUntil)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 1 && (
                <div className="bg-white rounded-xl shadow-lg border p-8">
                    <form onSubmit={handleGenerateOTP} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full border rounded-lg p-3 text-gray-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded-lg p-3 text-gray-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input required type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-3 text-gray-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                                <div className="flex items-center space-x-4">
                                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition flex items-center">
                                        <Upload className="h-4 w-4 mr-2" /> Upload Photo
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                    </label>
                                    {photoPreview && <img src={photoPreview} alt="Preview" className="h-10 w-10 rounded-full object-cover border" />}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Educational Qualifications</label>
                            <textarea required name="qualifications" value={formData.qualifications} onChange={handleChange} rows={3} className="w-full border rounded-lg p-3 text-gray-800 placeholder-gray-400" placeholder="e.g. B.Tech in Computer Science, 2024..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience & Skills</label>
                            <textarea required name="experience" value={formData.experience} onChange={handleChange} rows={3} className="w-full border rounded-lg p-3 text-gray-800 placeholder-gray-400" placeholder="e.g. Frontend Developer Intern at Tech Corp. React, Node.js..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Personal Info / Bio</label>
                            <textarea required name="personalInfo" value={formData.personalInfo} onChange={handleChange} rows={2} className="w-full border rounded-lg p-3 text-gray-800 placeholder-gray-400" placeholder="A short bio about your passions..." />
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-70 transition flex justify-center items-center">
                            {isLoading ? 'Processing...' : 'Save & Proceed to Verification'}
                        </button>
                    </form>
                </div>
            )}

            {step === 2 && (
                <div className="bg-white rounded-xl shadow-lg border p-8 max-w-lg mx-auto text-center">
                    <Lock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                    <p className="text-gray-600 mb-6">We've securely sent a 6-digit OTP to your registered email address.</p>
                    <form onSubmit={handleVerifyAndPay}>
                        <input 
                            type="text" 
                            maxLength={6} 
                            placeholder="Enter 6-digit OTP" 
                            className="w-full border-2 border-gray-300 rounded-lg p-4 text-center text-2xl tracking-widest text-gray-800 font-mono mb-6 focus:border-blue-500 focus:ring-0 outline-none"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-70 transition">
                            {isLoading ? 'Verifying...' : 'Verify OTP & Pay ₹50'}
                        </button>
                    </form>
                    <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-500 hover:text-blue-600">Back to Edit Info</button>
                </div>
            )}

            {step === 5 && existingResume && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Your Professional Resume</h2>
                        <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-1 rounded-full border border-green-200 flex items-center">
                            <Check className="h-4 w-4 mr-1" /> Attached to Profile
                        </span>
                    </div>

                    <div className="bg-white shadow-2xl rounded-sm p-10 max-w-3xl mx-auto border-t-8 border-blue-800">
                        <div className="flex items-center space-x-6 border-b pb-8 mb-8">
                            {existingResume.photoUrl ? (
                                <img src={existingResume.photoUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-gray-200" />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200">
                                    <UserIcon className="h-12 w-12 text-blue-600" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-4xl font-serif text-gray-900 font-bold tracking-tight">{existingResume.fullName}</h1>
                                <p className="text-lg text-gray-500 mt-2 flex items-center gap-4">
                                    <span>{existingResume.email}</span> • <span>{existingResume.phone}</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <section>
                                <h3 className="text-xl font-bold text-blue-800 uppercase tracking-widest border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
                                    <UserIcon className="h-5 w-5" /> Profile
                                </h3>
                                <p className="text-gray-700 leading-relaxed text-justify">{existingResume.personalInfo}</p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-blue-800 uppercase tracking-widest border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" /> Education & Qualifications
                                </h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{existingResume.qualifications}</p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-blue-800 uppercase tracking-widest border-b-2 border-blue-100 pb-2 mb-4 flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" /> Experience & Skills
                                </h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{existingResume.experience}</p>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
