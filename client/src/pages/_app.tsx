import Footer from "@/component/Footer";
import Navbar from "@/component/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

// Global Axios Interceptor to attach Firebase ID Token
axios.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.error("Error fetching Firebase token:", err);
    }
  }
  return config;
});

export default function App({ Component, pageProps }: AppProps) {
  function AuthListener() {
    const dispatch = useDispatch();
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((authuser) => {
        if (authuser) {
          // 1. Client-side guard for Mobile Time Restriction on refresh
          const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
          const isMobile = /Mobile|Android|iP(hone|od|ad)/i.test(ua);
          if (isMobile) {
            const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric' };
            const istHour = parseInt(new Date().toLocaleString('en-US', options), 10);
            if (istHour < 10 || istHour >= 13) {
                auth.signOut();
                toast.error("Mobile access is only allowed between 10:00 AM and 1:00 PM IST.");
                return;
            }
          }

          dispatch(
            login({
              uid: authuser.uid,
              photo: authuser.photoURL,
              name: authuser.displayName,
              email: authuser.email,
              phoneNumber: authuser.phoneNumber,
            })
          );
          
          // 2. Global synchronization + Server-side guard for pending Chrome OTP
          axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
            uid: authuser.uid,
            displayName: authuser.displayName,
            email: authuser.email,
            photoURL: authuser.photoURL
          }).catch(err => {
            if (err.response?.status === 403) {
              auth.signOut();
              toast.error(err.response.data.error || "Access Denied");
            } else {
              console.error("Global user sync failed:", err);
            }
          });
        } else {
          dispatch(logout());
        }
      });
      return () => unsubscribe();
    }, [dispatch]);
    return null;
  }

  return (
    <Provider store={store}>
      <AuthListener />
      <div className="bg-white">
        <ToastContainer />
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </div>
    </Provider>
  );
}