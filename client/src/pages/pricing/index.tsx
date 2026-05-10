import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Check, AlertTriangle, Clock, Zap, Star, Crown, Shield } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import Head from 'next/head';

const planRank: Record<string, number> = { Free: 0, Bronze: 1, Silver: 2, Gold: 3 };

const plans = [
  {
    name: 'Free',
    price: 0,
    limits: '1 application/month',
    icon: Shield,
    color: 'from-gray-400 to-gray-500',
    features: ['1 internship application/month', 'Basic platform access', 'Community support'],
  },
  {
    name: 'Bronze',
    price: 100,
    limits: '3 applications/month',
    icon: Star,
    color: 'from-amber-500 to-yellow-600',
    features: ['3 internship applications/month', 'Standard support', 'Application tracking'],
  },
  {
    name: 'Silver',
    price: 300,
    limits: '5 applications/month',
    icon: Zap,
    color: 'from-slate-400 to-slate-600',
    features: ['5 internship applications/month', 'Priority support', 'Application tracking', 'Early job alerts'],
    popular: true,
  },
  {
    name: 'Gold',
    price: 1000,
    limits: 'Unlimited applications',
    icon: Crown,
    color: 'from-yellow-400 to-amber-500',
    features: ['Unlimited applications/month', '24/7 Dedicated support', 'Application tracking', 'Resume review', 'Early job alerts'],
  },
];

// Compute how many minutes until the 10 AM IST window opens
function getMinutesUntilWindow(): number {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const h = ist.getHours();
  const m = ist.getMinutes();

  if (h === 10) return 0; // currently open
  // Minutes until next 10:00 AM IST
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

export default function Pricing() {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(false);
  // true = currently within 10:00–10:59 AM IST
  const [isTimeValid, setIsTimeValid] = useState(false);
  const [minutesUntil, setMinutesUntil] = useState(0);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  // Tick every minute to keep time gate accurate
  useEffect(() => {
    const update = () => {
      const mins = getMinutesUntilWindow();
      setIsTimeValid(mins === 0);
      setMinutesUntil(mins);
    };
    update();
    const id = setInterval(update, 30000); // every 30 s
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDbLoading(true);
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          });
          setDbUser(res.data);
        } catch (err) {
          console.error('Error syncing user', err);
        } finally {
          setDbLoading(false);
        }
      } else {
        setDbUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = useCallback(async (planName: string) => {
    // Auth guard
    if (!user) {
      toast.error('Please log in to subscribe.');
      return;
    }
    // DB user guard — still loading
    if (dbLoading || !dbUser) {
      toast.error('Please wait while your account loads.');
      return;
    }
    // Time window guard
    if (!isTimeValid) {
      toast.error('Payments are only allowed between 10:00 AM and 11:00 AM IST.');
      return;
    }
    // Downgrade guard
    if (planRank[planName] <= planRank[dbUser.plan ?? 'Free']) {
      toast.error(`You are already on the ${dbUser.plan} plan. You can only upgrade to a higher plan.`);
      return;
    }

    try {
      // 1. Create order
      const orderRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/create-order`, {
        plan: planName,
        uid: user.uid,
      });
      const { order } = orderRes.data;

      // 2. Open Razorpay checkout
      // Key from env — never hardcode in source
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
      const options = {
        key: rzpKey,
        amount: order.amount,
        currency: order.currency,
        name: 'Intern Area',
        description: `${planName} Plan Subscription — ₹${order.amount / 100}/month`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // 3. Verify payment
            const verifyRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'mock_signature',
              plan: planName,
              uid: user.uid,
            });

            toast.success(verifyRes.data.message);
            setLastInvoice({
              ref: verifyRes.data.invoiceRef,
              plan: verifyRes.data.plan,
              transactionId: verifyRes.data.transactionId,
            });
            // Update local plan immediately without re-fetching
            setDbUser((prev: any) => ({ ...prev, plan: planName, applicationsThisMonth: 0 }));
          } catch (err: any) {
            toast.error(err.response?.data?.error || 'Payment verification failed.');
          }
        },
        prefill: {
          name: user.displayName || 'User',
          email: user.email || 'user@example.com',
        },
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: () => toast.info('Payment cancelled.'),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error initiating payment. Please try again.');
    }
  }, [user, dbUser, dbLoading, isTimeValid]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Head>
        {/* Razorpay checkout SDK */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </Head>

      {/* Page header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Subscription Plans</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Supercharge your career journey. Choose the plan that fits your ambition.
        </p>

        {/* Time-window banner */}
        {isTimeValid ? (
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Payment window is open — 10:00 AM to 11:00 AM IST
          </div>
        ) : (
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 px-6 py-4 rounded-xl text-sm font-medium shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
              <span>Payments are only available <strong>10:00 AM – 11:00 AM IST</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-lg">
              <Clock size={14} />
              <span>
                {minutesUntil === 0
                  ? 'Window just closed'
                  : `Opens in ~${formatCountdown(minutesUntil)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Invoice receipt after payment */}
      {lastInvoice && (
        <div className="mb-10 bg-green-50 border border-green-300 rounded-xl p-5 max-w-xl mx-auto">
          <h3 className="font-bold text-green-800 text-base mb-2">✅ Payment Successful — Invoice</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p><span className="font-semibold">Invoice Ref:</span> {lastInvoice.ref}</p>
            <p><span className="font-semibold">Transaction ID:</span> {lastInvoice.transactionId}</p>
            <p><span className="font-semibold">Plan Activated:</span> {lastInvoice.plan}</p>
          </div>
          <p className="text-xs text-green-600 mt-2">A detailed invoice has been sent to your registered email.</p>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
        {plans.map((plan) => {
          const isCurrentPlan = dbUser?.plan === plan.name;
          const isDowngrade = planRank[plan.name] < planRank[dbUser?.plan ?? 'Free'];
          const isSamePlan = plan.name === (dbUser?.plan ?? 'Free');
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg border-2 flex flex-col transition-transform hover:-translate-y-1 ${
                isCurrentPlan ? 'border-blue-500' : (plan as any).popular ? 'border-indigo-400' : 'border-transparent'
              }`}
            >
              {/* Current plan badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                  Current Plan
                </div>
              )}
              {/* Popular badge */}
              {(plan as any).popular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              {/* Icon header */}
              <div className={`rounded-t-2xl bg-gradient-to-br ${plan.color} p-6 flex items-center gap-3`}>
                <PlanIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                  <p className="text-white/80 text-xs">{plan.limits}</p>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                {/* Price */}
                <div className="flex items-baseline mb-5">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-extrabold text-gray-900">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                      <span className="text-gray-500 ml-1 text-sm">/month</span>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {plan.price === 0 ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-400 py-2.5 px-4 rounded-xl font-semibold cursor-not-allowed text-sm"
                  >
                    Default Plan
                  </button>
                ) : isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-2.5 px-4 rounded-xl font-semibold cursor-not-allowed text-sm"
                  >
                    ✓ Active
                  </button>
                ) : isDowngrade ? (
                  <button
                    disabled
                    title="You cannot downgrade your plan"
                    className="w-full bg-gray-100 text-gray-400 py-2.5 px-4 rounded-xl font-semibold cursor-not-allowed text-sm"
                  >
                    Not Available
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={!isTimeValid || dbLoading}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                      !isTimeValid || dbLoading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {dbLoading ? 'Loading...' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-gray-400 mt-10">
        Payments are processed via Razorpay and are strictly limited to the 10:00 AM – 11:00 AM IST window.
        Subscription limits reset on the 1st of every month.
      </p>
    </div>
  );
}
