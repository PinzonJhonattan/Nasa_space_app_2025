# 🌦️ Astrochiguis – When Skies Decide

## 🛰️ Summary

**When Skies Decide** is an interactive web application as part of the **NASA Space Apps Challenge 2025**, that helps users plan outdoor activities through detailed weather forecasts and AI-generated recommendations.

The system integrates meteorological data from multiple global sources, including **NASA POWER** and **Open-Meteo**, to deliver accurate predictions and personalized insights for each user's context.

Through a user-centered design, the platform not only presents raw weather information but also analyzes how climatic factors affect real-life activities in recreation, agriculture, transportation, and tourism, fostering environmental awareness and informed decision-making.

---

## 🎥 Project Demonstration

- **Video**: [YouTube Presentation](https://www.youtube.com/watch?v=u5E_jyFJqhg)
- **Live Demo**: [Deployed App on AWS S3](http://nasa-space-app-2025.s3-website.us-east-2.amazonaws.com/)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **pnpm** (recommended)
- **Angular CLI** (v20.2.2 or higher)

### Installation

1. **Clone the repository**

```bash
git clone git@github.com:PinzonJhonattan/Nasa_space_app_2025.git
cd Nasa_space_app_2025
```

2. **Install dependencies**

Using npm:
```bash
npm install
```

Or using pnpm (recommended):
```bash
pnpm install
```

### Running the Application

1. **Development server**

```bash
ng serve
```

The application will start at `http://localhost:4200/`. The app will automatically reload when you make changes to source files.

---

## ⚙️ Project Details

### 🧩 What does When Skies Decide do?

**When Skies Decide** predicts weather conditions based on a selected location, date, and hour range.

It merges real-time forecasts (**Open-Meteo**) with historical analysis (**NASA POWER**) to display:

- **Time**
- **Temperature** (°C)
- **Wind speed** (km/h)
- **Relative humidity** (%)
- **Precipitation** (mm)
- **Discomfort factors** and **overall comfort level**

An AI chatbot (**Qwen Flash**) analyzes these variables to provide actionable insights, recommendations, and risk alerts.

---

## 🧭 User Flow

### 🖥️ Initial Interface

Upon entering, the user encounters a modern and clean interface with intuitive navigation.
<img width="1024" height="550" alt="1" src="https://github.com/user-attachments/assets/83209c86-c084-4ca8-8ec0-578d14784a4d" />

Activities are displayed as interactive cards categorized by **Sports**, **Agriculture**, **Transportation**, **Tourism**, and **Events**.
<img width="1024" height="550" alt="2" src="https://github.com/user-attachments/assets/f50df772-3de2-4cba-91cd-d35e5ef8f7a4" />


### ➕ Custom Activities

If the desired activity isn't listed, users can create a personalized activity, adding:

- Title
- Category
- Description

The system saves this locally and uses it for personalized AI recommendations.

<img width="1024" height="550" alt="3" src="https://github.com/user-attachments/assets/b4e6bbc3-3d45-4b0e-99e5-3f64026aa4e8" />

### 🌍 Interactive Map System

The app includes a **global interactive map** (Mapbox GL JS) with 2D and 3D visualization.

Users can click any point on Earth to get latitude and longitude, which the system uses for weather queries.

The map integrates open satellite layers such as **NASA MODIS** and dynamically loads data to ensure high performance.

<img width="1024" height="550" alt="4" src="https://github.com/user-attachments/assets/8c386e7e-9f4a-48c4-bc5b-9ad5d489228b" />
<img width="1024" height="550" alt="5" src="https://github.com/user-attachments/assets/74c75be8-045b-4293-874e-531b576a20ee" />

### 🕒 Date and Time Selection System

Users can select a specific date and hourly range for their activity.

- **0–15 days**: Open-Meteo API (real-time models like GFS, ECMWF)
- **>15 days**: NASA POWER (historical data analysis)

If the date exceeds 15 days, the app applies a statistical pattern analysis, comparing the last 5 years of the same day/month to estimate averages, min/max values, and confidence using:

```typescript
confidence = 100 - (standardDeviation × 5)
```

<img width="1024" height="550" alt="6" src="https://github.com/user-attachments/assets/bd594815-49df-4e93-8fad-10a4ff7ace32" />

### 📊 Interactive Weather Visualization

With one click, users access interactive charts and tables showing:

- Temperature and humidity (2m)
- Wind speed (10m)
- Precipitation (mm)

The app uses **Chart.js**, **PrimeNG Charts**, **HTML5 Canvas**, and **CSS3 animations** for smooth visualizations.
<img width="1024" height="550" alt="7" src="https://github.com/user-attachments/assets/f58a852a-787f-4977-9907-987a76c3194e" />
<img width="1024" height="550" alt="8" src="https://github.com/user-attachments/assets/277b1676-37ef-48db-8c7e-f6ef5385f638" />

### 🌡️ Comfort and Threshold System

The comfort system evaluates five main factors:

- **Cold**
- **Heat**
- **Wind**
- **Humidity**
- **Rain**

Each activity has customized thresholds, and the system calculates an hourly comfort score (0–100%).

Results are visualized as color-coded indicators:

- 🟢 **≥70%** — Favorable
- 🟡 **40–69%** — Moderate
- 🔴 **<40%** — Difficult
<img width="1024" height="550" alt="9" src="https://github.com/user-attachments/assets/5895e085-267f-4d27-955e-9a7a510bc5aa" />

### 🤖 AI Chatbot: Qwen Flash

The chatbot uses **Qwen Flash**, fine-tuned for meteorological reasoning.

It analyzes data by activity type and provides human-like explanations:

- "✅ Recommended"
- "⚠️ Caution"
- "❌ Not Recommended"

It also remembers conversation context, detects location/time changes, and suggests quick questions like:

- "Should I cancel my activity?"
- "What should I wear?"

<img width="1024" height="550" alt="10" src="https://github.com/user-attachments/assets/562428ec-35be-4b1b-b05e-c39c9031bc3f" />

### 📄 PDF Report Generation

Once the analysis is complete, the system allows users to download a structured PDF report.

It uses:

- **jsPDF** → for creating and formatting the document
- **html2canvas** → for converting charts and visuals into images

The report includes:

- Weather summary (temperature, wind, humidity, precipitation)
- Comfort analysis (visual comfort bar + discomfort table)
- Activity details (location, date, time)

<img width="1024" height="550" alt="11" src="https://github.com/user-attachments/assets/201a3693-7dbb-4ea5-a36f-298b183989d8" />

### 🌐 Global Climate View

A real-time global climate viewer allows users to explore wind, temperature, pressure, and precipitation worldwide.

It also provides direct links to **NASA EarthData** resources for deeper exploration.

<img width="1024" height="550" alt="12" src="https://github.com/user-attachments/assets/c287832c-8407-48d5-8f87-e276b958c732" />


---

## 🎯 Objectives

- **Democratize weather intelligence** — Make complex meteorological data accessible to all users.
- **Promote preventive planning** — Help users anticipate risks and optimize resources.
- **Encourage environmental awareness** — Understand how weather impacts human activities globally.

---

## 🧰 Tools and Technologies

| Category | Tools |
|----------|-------|
| **Development** | Visual Studio Code, Cursor AI, Angular CLI, NPM |
| **Languages** | TypeScript, HTML5, SCSS |
| **Framework / UI** | Angular, PrimeNG |
| **Data Visualization** | Chart.js, HTML5 Canvas |
| **Artificial Intelligence** | Qwen Flash (chatbot), Gemini AI (visual generation) |
| **APIs / Data Services** | Open-Meteo API, NASA POWER API |
| **Maps / Geolocation** | Mapbox GL JS |
| **Documents** | jsPDF, html2canvas |
| **Deployment** | AWS S3, AWS Lambda |
| **Version Control** | Git, GitHub |


---


## 📄 License & Credits

**Developed for NASA Space Apps Challenge 2025**

**By: Astrochiguis Team**
- **Jhonattan Pinzon** [Linkendin](https://www.linkedin.com/in/jhonattan-sabogal-pinz%C3%B3n-4584ab23a/) | [Instagram](https://www.instagram.com/paco_pinz/)
- **Oliver Velásquez** [Linkendin](https://www.linkedin.com/in/olivervlz/) | [Instagram](https://www.instagram.com/oliver.vlz/)
- **Violeta Jaramillo Castañeda** [Instagram](https://www.instagram.com/violett_velvet_/)
- **Lina Castañeda** [Linkendin](https://www.linkedin.com/in/linacast/) | [Instagram](https://www.instagram.com/1.lmcc/)


**🌍 Making weather data accessible for everyone, everywhere.**
