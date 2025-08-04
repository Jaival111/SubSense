# SubSense - App Subscription Management Tool

**SubSense** is a smart subscription management tool that helps users **track, analyze**, and **optimize** their app subscriptions. It uses app usage patterns to suggest whether a user should retain or omit a subscription.

---

## Features

- **Daily Activity Tracking**: Uses a cron job to fetch user activity data every day.
- **Smart Recommendations**: Basic statistical inferences (planned upgrade to ML model) determine if a subscription is underused.
- **Email Reminders**: Automatic email notifications sent at the end of each billing cycle.
- **Spotify Integration**: Currently supports Spotify — the only app providing public usage data.
- **JWT Authentication**: Secure login and signup with token-based authentication.
- **Responsive UI**: Clean and interactive UI built with Bootstrap and Particles.js.

---

## Tech Stack

| Layer      | Technology         |
|------------|--------------------|
| Frontend   | React.js           |
| Backend    | FastAPI (Python)   |
| Database   | PostgreSQL         |
| Auth       | JWT Authentication |
| Scheduler  | [cron-job.org](https://cron-job.org) |
| Styling    | Bootstrap, Particles.js |

---

## How It Works

1. **User Connects Spotify Account**
2. **Daily Cron Job** fetches activity data via the Spotify API
3. **Logic Engine** performs basic analysis to determine usage frequency
4. **Notification System** alerts the user via email if the subscription seems unnecessary

> Future upgrades include a Machine Learning model to enhance decision-making and support for more apps.

---

## Project Status

This project is currently in its MVP (Minimum Viable Product) phase. It is **open to contributions**, but there are **no immediate plans** for expansion.

---

## Get in Touch

For any queries, feel free to reach out or contribute to the project via a pull request.

---

## Thank You

Thanks for checking out **SubSense**! Built with care to help users take control of their digital expenses.
<br/>
Find my linkedin post about the app [here](https://www.linkedin.com/posts/jaival-chauhan_subsense-mentalaccountingbias-subscriptionfatigue-activity-7349954470203523073-rheg?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEUPjHMBduDt_LjTs343xGkQW20Os1CszdY).
