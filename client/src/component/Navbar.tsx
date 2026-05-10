import React, { useEffect, useState } from "react";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { ChevronDown, Search, Globe, X, Menu, Eye, EyeOff, Mail, Lock, User as UserIcon } from "lucide-react";
import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import Head from "next/head";

type GoogleTranslateWindow = Window & { googleTranslateElementInit?: () => void };

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "hi", name: "Hindi" },
  { code: "pt", name: "Portuguese" },
  { code: "zh-CN", name: "Chinese" },
  { code: "fr", name: "French" },
];

const Navbar = () => {
  const user = useSelector(selectuser);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auth Modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // French OTP
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);

  // Chrome OTP
  const [isChromeOtpModalOpen, setIsChromeOtpModalOpen] = useState(false);
  const [chromeOtp, setChromeOtp] = useState("");
  const [loginRecordId, setLoginRecordId] = useState("");
  const [pendingUserUid, setPendingUserUid] = useState("");

  useEffect(() => {
    (window as GoogleTranslateWindow).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,es,hi,pt,zh-CN,fr", autoDisplay: false },
        "google_translate_element"
      );
    };
  }, []);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthEmail("");
    setAuthPassword("");
    setAuthName("");
    setShowPassword(false);
    setIsAuthOpen(true);
    setIsMobileOpen(false);
  };

  const triggerTranslation = (langCode: string) => {
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) { select.value = langCode; select.dispatchEvent(new Event("change")); }
    setCurrentLang(langCode);
    setIsLangOpen(false);
  };

  const handleLanguageSelect = async (langCode: string) => {
    if (langCode === "fr") {
      if (!user) { toast.error("You must be logged in to switch to French."); setIsLangOpen(false); return; }
      setIsLangOpen(false);
      setIsOtpModalOpen(true);
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/language/send-otp`, { uid: user.uid });
        toast.success("OTP sent to your email to unlock French.");
      } catch { toast.error("Failed to send OTP"); setIsOtpModalOpen(false); }
    } else { triggerTranslation(langCode); }
  };

  const handleVerifyFrenchOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsLoadingOtp(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/language/verify-otp`, { uid: user.uid, otp });
      toast.success("French language unlocked!");
      setIsOtpModalOpen(false);
      triggerTranslation("fr");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid OTP");
    } finally { setIsLoadingOtp(false); setOtp(""); }
  };

  // Shared post-login tracking for all auth methods
  const trackLogin = async (currentUser: any) => {
    const ua = navigator.userAgent;
    const browser = /Chrome/i.test(ua) && !/Edge|Edg/i.test(ua) ? "Chrome" :
                    /Firefox/i.test(ua) ? "Firefox" :
                    /Safari/i.test(ua) && !/Chrome/i.test(ua) ? "Safari" : "Other";
    const os = /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "MacOS" :
               /Linux/i.test(ua) ? "Linux" : /Android/i.test(ua) ? "Android" :
               /iOS|iPhone|iPad/i.test(ua) ? "iOS" : "Other";
    const deviceType = /Mobile|Android|iP(hone|od|ad)/i.test(ua) ? "Mobile" : "Desktop";
    let ipAddress = "Unknown";
    try { const ipRes = await axios.get("https://api.ipify.org?format=json"); ipAddress = ipRes.data.ip; } catch {}

    const trackRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/track-login`, {
      uid: currentUser.uid, email: currentUser.email, browser, os, deviceType, ipAddress,
    });

    if (trackRes.status === 202) {
      setLoginRecordId(trackRes.data.recordId);
      setPendingUserUid(currentUser.uid);
      setIsChromeOtpModalOpen(true);
    } else {
      toast.success(authMode === "register" ? "Account created successfully!" : "Logged in successfully!");
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthOpen(false);
    try {
      const result = await signInWithPopup(auth, provider);
      await trackLogin(result.user).catch(() => signOut(auth));
    } catch (error: any) {
      signOut(auth);
      toast.error(error.response?.data?.error || "Google login failed");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) { toast.error("Please fill in all fields"); return; }
    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setIsAuthOpen(false);
      await trackLogin(result.user).catch(() => signOut(auth));
    } catch (error: any) {
      const code = error.code;
      if (code === "auth/user-not-found") toast.error("No account found. Please create one.");
      else if (code === "auth/wrong-password" || code === "auth/invalid-credential") toast.error("Incorrect password.");
      else if (code === "auth/invalid-email") toast.error("Invalid email address.");
      else toast.error("Login failed. Please try again.");
    } finally { setAuthLoading(false); }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail || !authPassword) { toast.error("Please fill in all fields"); return; }
    if (authPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      await updateProfile(result.user, { displayName: authName.trim() });
      setIsAuthOpen(false);
      await trackLogin(result.user).catch(() => signOut(auth));
    } catch (error: any) {
      const code = error.code;
      if (code === "auth/email-already-in-use") toast.error("An account with this email already exists.");
      else if (code === "auth/invalid-email") toast.error("Invalid email address.");
      else if (code === "auth/weak-password") toast.error("Password is too weak.");
      else toast.error("Registration failed. Please try again.");
    } finally { setAuthLoading(false); }
  };

  const handleVerifyChromeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-login-otp`, {
        uid: pendingUserUid, otp: chromeOtp, recordId: loginRecordId,
      });
      toast.success("Login Verified!");
      setIsChromeOtpModalOpen(false);
    } catch (err: any) { toast.error(err.response?.data?.error || "Invalid OTP"); }
  };

  const handlelogout = () => { signOut(auth); };

  const navLinks = [
    { href: "/internship", label: "Internships" },
    { href: "/job", label: "Jobs" },
    { href: "/public-space", label: "Public Space" },
    { href: "/pricing", label: "Pricing" },
    { href: "/resume", label: "Resume Builder" },
  ];

  return (
    <>
      <Head>
        <script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" async></script>
        <style>{`
          .goog-te-banner-frame.skiptranslate, .goog-te-gadget-icon { display: none !important; }
          body { top: 0px !important; }
          #google_translate_element { display: none !important; }
        `}</style>
      </Head>

      <div id="google_translate_element"></div>

      <div className="sticky top-0 z-50">
        <nav className="glass-heavy transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <a href="/" className="text-xl font-bold text-blue-600">
                  <img src="/logo.png" alt="Logo" className="h-16" />
                </a>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center space-x-6">
                {navLinks.map(link => (
                  <Link key={link.href} href={link.href} className="relative text-gray-700 hover:text-primary-600 font-medium transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-primary-600 after:transition-all after:duration-300 hover:after:w-full">
                    {link.label}
                  </Link>
                ))}

                <div className="flex items-center bg-gray-100/50 backdrop-blur-sm rounded-full px-4 py-2 border border-transparent hover:border-primary-300 transition-colors">
                  <Search size={16} className="text-gray-400" />
                  <input type="text" placeholder="Search..." className="ml-2 bg-transparent focus:outline-none text-sm w-32 lg:w-48" />
                </div>

                {/* Language Dropdown */}
                <div className="relative">
                  <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                    <Globe size={18} />
                    <span className="uppercase text-sm font-bold">{currentLang}</span>
                    <ChevronDown size={14} />
                  </button>
                  {isLangOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg py-1 z-50">
                      {languages.map((lang) => (
                        <button key={lang.code} onClick={() => handleLanguageSelect(lang.code)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Auth */}
              <div className="hidden md:flex items-center space-x-3">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <Link href="/profile">
                      <img src={user.photo || "/logo.png"} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                    </Link>
                    <button className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition" onClick={handlelogout}>
                      Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => openAuth("login")} className="text-sm font-medium text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-md bg-white/50 backdrop-blur-sm">
                      Login
                    </button>
                    <button onClick={() => openAuth("register")} className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-all duration-300 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5">
                      Create Account
                    </button>
                    <a href="/adminlogin" className="text-gray-500 hover:text-gray-700 text-sm font-medium">Admin</a>
                  </>
                )}
              </div>

              {/* Mobile Hamburger */}
              <button className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle menu">
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {isMobileOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-4 pt-2 space-y-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)} className="block py-2 text-gray-700 hover:text-blue-600 font-medium border-b border-gray-100">
                  {link.label}
                </Link>
              ))}
              <div className="pt-2">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={user.photo || "/logo.png"} alt="Profile" className="w-8 h-8 rounded-full border" />
                      <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    </div>
                    <button className="text-sm font-medium text-red-600 border border-red-200 px-3 py-1 rounded-md" onClick={() => { handlelogout(); setIsMobileOpen(false); }}>
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => openAuth("login")} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Login
                    </button>
                    <button onClick={() => openAuth("register")} className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
                      Create Account
                    </button>
                    <a href="/adminlogin" className="text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-1">Admin Login</a>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* ─── Auth Modal ─── */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="glass-heavy w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up border border-white/50">
            {/* Close */}
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
              <X size={22} />
            </button>

            {/* Header gradient */}
            <div className="bg-gradient-to-r from-primary-500 to-indigo-600 px-8 pt-8 pb-6 text-white">
              <h2 className="text-2xl font-extrabold mb-1">
                {authMode === "login" ? "Welcome back 👋" : "Get started today 🚀"}
              </h2>
              <p className="text-blue-100 text-sm">
                {authMode === "login" ? "Sign in to your Intern Area account" : "Create your free account in seconds"}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200/50 bg-white/40">
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${authMode === "login" ? "text-primary-600 border-b-2 border-primary-600 bg-white/60" : "text-gray-500 hover:text-gray-700"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${authMode === "register" ? "text-primary-600 border-b-2 border-primary-600 bg-white/60" : "text-gray-500 hover:text-gray-700"}`}
              >
                Create Account
              </button>
            </div>

            <div className="px-8 py-6">
              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition mb-5 shadow-sm"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Form */}
              <form onSubmit={authMode === "login" ? handleEmailLogin : handleEmailRegister} className="space-y-4">
                {authMode === "register" && (
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={authMode === "register" ? "Password (min. 6 characters)" : "Password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {authMode === "login" && (
                  <div className="text-right">
                    <a href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5"
                >
                  {authLoading ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" /> Processing...</>
                  ) : authMode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-500 mt-5">
                {authMode === "login" ? (
                  <>Don't have an account?{" "}
                    <button onClick={() => setAuthMode("register")} className="text-blue-600 font-semibold hover:underline">Sign up free</button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button onClick={() => setAuthMode("login")} className="text-blue-600 font-semibold hover:underline">Sign in</button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* French OTP Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full relative">
            <button onClick={() => setIsOtpModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Language Change</h3>
            <p className="text-sm text-gray-600 mb-4">To apply French, please enter the 6-digit OTP sent to your email.</p>
            <form onSubmit={handleVerifyFrenchOTP}>
              <input type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP"
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-center text-xl tracking-widest font-mono mb-4 focus:border-blue-500 outline-none" />
              <button type="submit" disabled={isLoadingOtp} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-70">
                {isLoadingOtp ? "Verifying..." : "Verify & Translate"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chrome Security OTP Modal */}
      {isChromeOtpModalOpen && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Security Verification</h2>
            <p className="text-gray-600 mb-8">We detected a login from Google Chrome. For your security, please enter the OTP sent to your registered email.</p>
            <form onSubmit={handleVerifyChromeOtp}>
              <input type="text" maxLength={6} required value={chromeOtp} onChange={(e) => setChromeOtp(e.target.value)} placeholder="Enter 6-digit OTP"
                className="w-full border-2 border-gray-300 rounded-lg p-4 text-center text-2xl tracking-widest font-mono mb-6 focus:border-blue-600 outline-none" />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                Verify & Continue
              </button>
            </form>
            <button onClick={() => { signOut(auth); setIsChromeOtpModalOpen(false); }} className="mt-6 text-sm text-red-500 hover:text-red-700 font-medium">
              Cancel Login
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
