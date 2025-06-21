# ⛅ Weather2Day

**Weather2Day** is a sleek and responsive weather app built to demonstrate my frontend development skills. 
It provides current weather conditions using IP address–based geolocation, 3-day forecasts, and city-based weather 
lookups with a clean and intuitive user interface.

🌐 **Live Demo**: [Weather2Day](https://zhouw9n.github.io/Weather2Day/)

> ⚠️ **Note**: The backend server is hosted on Render’s free tier and may take **30–60 seconds to spin up** if inactive.
Thank you for your patience!

---

> ## ✨ Features

- Updates current weather based on IP address geo-location
- Displays temperature, weather condition, humidity, UV index, wind, sunrise, and sunset
- Shows a 3-day weather forecast (limited to 3 days due to Weather API free tier)
- Converts UV index and wind direction for more user-friendly display and additional context
  (e.g, UV index 8 -> Very High, wind 360° -> North)
- Search for cities/locations with autocomplete suggestions
- Custom weather code-to-icon mapping (e.g., code 103 -> Sunny)
- Saves previously searched locations in `localStorage`
- Clean and modern UI
- Fully responsive on all screen sizes
- Handles invalid searches
- Debouncing to prevent unnecessary API calls during typing
- Smooth animations for better UX
  
---

> ## 🛠️ Tech Stack

This project highlights API handling and raw data formatting to improve usability and readability.

### Frontend

- JavaScript / HTML / CSS

### Backend

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- Hosted on: [Render](https://render.com/)

### APIs Used

- [Weather API](https://www.weatherapi.com/docs/) - for weather data and forecast (free tier)
- [ipify API](https://www.ipify.org/) - to fetch the user's public IP address
- [ipapi](https://ipapi.co/api/) - for IP-based geolocation

---

> ## 📁 Project Structure

![Capture](https://github.com/user-attachments/assets/972526b8-4157-4085-b477-79748d36ad2e)

---

> ## 📸 Screenshots

### Desktop
![Capture](https://github.com/user-attachments/assets/64a9d8ad-18bf-4ad3-b78c-0733535d99a8)

![Capture1](https://github.com/user-attachments/assets/0367ad4a-3bd2-4697-818d-99f4e3b82896)

![Capture2](https://github.com/user-attachments/assets/66c1acce-c021-4710-b034-e0c19cd515a1)

### Mobile
![Capture3](https://github.com/user-attachments/assets/acf3d1a3-f63c-499b-a9a8-f833ca909f21)

![Capture4](https://github.com/user-attachments/assets/fc42f191-1fba-4b82-979d-2f7cd38da042)

![Capture5](https://github.com/user-attachments/assets/632e6f8c-b91c-491d-8e2a-49f8681b1b95)
