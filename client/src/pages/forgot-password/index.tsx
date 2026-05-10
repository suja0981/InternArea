import axios from "axios";
import { KeyRound, Mail, Phone, Copy, Check, AlertTriangle, ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";
import Link from "next/link";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [rateLimitMsg, setRateLimitMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Detect whether input looks like a phone number (all digits)
  const isPhoneInput = /^[0-9]+$/.test(identifier.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = identifier.trim();
    if (!trimmed) {
      toast.error("Please enter your email or phone number.");
      return;
    }

    // Basic client-side format validation
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^[0-9]{7,15}$/.test(trimmed);
    if (!isEmail && !isPhone) {
      toast.error("Please enter a valid email address or phone number (digits only).");
      return;
    }

    setNewPassword("");
    setRateLimitMsg("");
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        { identifier: trimmed }
      );
      toast.success(res.data.message);
      setNewPassword(res.data.newPassword);
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data?.error || "An error occurred. Please try again.";

      if (status === 429) {
        // Daily limit reached — show inline warning banner
        setRateLimitMsg(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword).then(() => {
      setCopied(true);
      toast.success("Password copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="mt-5 text-center text-3xl font-extrabold text-gray-900">
          Forgot Password?
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your registered email or phone number. We'll generate a new password for you.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10">

          {/* Daily limit warning banner */}
          {rateLimitMsg && (
            <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-4 rounded-xl" role="alert">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold text-sm">Daily Limit Reached</p>
                <p className="text-sm mt-0.5">{rateLimitMsg}</p>
                <p className="text-xs mt-1 text-amber-600">You can try again tomorrow.</p>
              </div>
            </div>
          )}

          {newPassword ? (
            /* ── Success State: show generated password ── */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Check className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Password Generated!</h2>
              <p className="text-sm text-gray-500 mb-5">
                Your new temporary password is shown below. Copy it and use it to log in, then change it immediately.
              </p>

              {/* Password display box */}
              <div className="relative bg-gray-900 rounded-xl p-5 mb-3">
                <p className="font-mono text-2xl tracking-[0.25em] text-green-400 break-all select-all">
                  {newPassword}
                </p>
                <button
                  onClick={handleCopy}
                  title="Copy password"
                  className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-1.5 rounded-lg transition"
                >
                  {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-2">
                Contains only uppercase &amp; lowercase letters. No numbers or special characters.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Length: <strong>{newPassword.length} characters</strong>
              </p>

              {/* Copy button (larger) */}
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition mb-4 ${
                  copied
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Password</>}
              </button>

              {/* Return to Login — correct route for regular users */}
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <ArrowLeft size={16} />
                Return to Login
              </Link>
            </div>
          ) : (
            /* ── Default State: reset request form ── */
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                  Email or Phone Number
                </label>
                <div className="relative rounded-lg shadow-sm">
                  {/* Adaptive icon: Phone when digits detected, Mail otherwise */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isPhoneInput && identifier.length > 0
                      ? <Phone className="h-5 w-5 text-blue-400" />
                      : <Mail className="h-5 w-5 text-gray-400" />}
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      // Clear rate limit banner when user starts editing
                      if (rateLimitMsg) setRateLimitMsg("");
                    }}
                    className="block w-full text-gray-900 pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g. user@example.com or 9876543210"
                    autoComplete="email"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  Enter a valid email address or a phone number (digits only).
                </p>
              </div>

              {/* Rate limit info */}
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                <AlertTriangle size={14} className="flex-shrink-0 text-blue-500" />
                <span>You can request a password reset <strong>once per day</strong> per email/phone.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" /> Generating...</>
                ) : (
                  <><KeyRound size={16} /> Reset My Password</>
                )}
              </button>
            </form>
          )}

          {/* Bottom link — correct route for regular users, not /adminlogin */}
          {!newPassword && (
            <div className="mt-6 text-center text-sm">
              <Link href="/" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
