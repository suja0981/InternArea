# 🚀 Intern Area — Internship & Job Platform

A full-stack platform that helps students **discover internships/jobs, apply efficiently, and manage applications**, with premium features like resume building and community engagement.

---

## ✨ Key Features

- 🔍 Browse internships & jobs with detailed listings
- 📝 Apply with profile + cover letter
- 📊 Track applications in real-time
- 🔐 Google Authentication (Firebase)
- 💳 Subscription-based plans (Razorpay integration)
- 🧾 Resume Builder (premium feature)
- 🌐 Community feed with posts, likes, comments
- 🛠️ Admin dashboard to manage jobs & applications

---

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Redux
- **Backend:** Node.js, Express, MongoDB
- **Auth & Storage:** Firebase
- **Payments:** Razorpay

---

## 🏗️ Architecture

```
client/  → Next.js frontend
server/  → Express API + MongoDB
```

---

## ⚡ Highlights

- Designed **plan-based application limits system**
- Integrated **secure payment workflow using Razorpay**
- Built **OTP-gated premium features**
- Developed **community social feed system**
- Implemented **resume generation + storage**

---

## ▶️ Run Locally

```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm run dev
```

---

## 🔑 Admin Login Credentials

> [!IMPORTANT]
> These credentials are for **local development only** (defined in `server/.env`).
> For the live deployment, the same values must be set as environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) in the **Render dashboard**.

| Field        | Value (Local Dev)                              |
|--------------|------------------------------------------------|
| **URL**      | https://intern-area-phi.vercel.app/adminlogin  |
| **Username** | `AdminUser`                                    |
| **Password** | `AdminPassword`                                |

The admin panel allows managing internship/job listings and reviewing user applications.

---

## 🔮 Future Improvements

- Strong authentication & authorization
- Production-ready payment validation
- Automated testing
- API documentation

---

## 📌 Why This Project?

This project demonstrates:

- Full-stack development skills
- Real-world feature integration (payments, auth, storage)
- Scalable architecture design

---

## 📎 Links

- 🌐 Live Demo: https://intern-area-phi.vercel.app/

## Contact

For questions, collaboration, or project feedback:

- Open an issue in this repository
- Email: sujalwadhankar999@gmail.com
