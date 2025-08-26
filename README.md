# VoxCampus 📱🎓

**Your Campus. Your Network. Your Voice.**

VoxCampus is a modern campus networking platform built with React Native and Appwrite, designed to connect students, faculty, and staff in a seamless digital environment.

## 🌟 About VoxCampus

VoxCampus aims to revolutionize campus communication by providing a centralized platform for:
- **Student Networking** - Connect with peers across different departments
- **Event Management** - Stay updated with campus events and activities  
- **Academic Resources** - Share and access study materials
- **Campus Announcements** - Real-time updates from administration
- **Community Building** - Foster stronger campus relationships

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Appwrite (BaaS)
- **Database**: Appwrite Database
- **Authentication**: Appwrite Auth
- **Real-time**: Appwrite Realtime
- **Storage**: Appwrite Storage

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Xcode) or Android Emulator

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AdiArtifice/github-webstorm-demo.git
cd VoxCampus
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Appwrite**
- Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
- Update `lib/appwrite.js` with your project credentials
- Set up your database collections and permissions

4. **Run the application**
```bash
npm start
```
Download [Expo Go](https://expo.dev/go) to run the app on your device.

## ✅ Current Features

- [x] React Native + Appwrite integration
- [x] Project structure setup
- [x] Basic configuration
- [ ] User authentication
- [ ] Student profiles  
- [ ] Campus feed
- [ ] Event management
- [ ] Real-time messaging
- [ ] File sharing

## 🎯 Roadmap

### Phase 1: Foundation
- User authentication (signup/login)
- Student profile creation
- Basic navigation structure

### Phase 2: Core Features  
- Campus news feed
- Event discovery and management
- Student directory

### Phase 3: Advanced Features
- Real-time chat system
- Study groups
- Resource sharing
- Push notifications

### Phase 4: Enhancement
- Advanced search and filters
- Analytics dashboard
- Mobile app optimization

## 🏗️ Project Structure

```
VoxCampus/
├── lib/
│   └── appwrite.js         # Appwrite configuration
├── components/             # Reusable components
├── screens/               # Screen components
├── scripts/
│   └── reset-project.js   # Development utilities
├── assets/                # Images, fonts, etc.
└── App.js                 # Main application entry
```

## 👨‍💻 Developer

**Aditya** - AI/ML Engineering Student  
- 🎓 B.Tech in AIML, St. John College of Engineering and Management
- 🏫 University of Mumbai  
- 💼 Specialized in Python, Machine Learning, and Mobile Development

## 📝 Development Notes

This project was bootstrapped from the Appwrite React Native starter template and customized for campus networking use cases.

## 🤝 Contributing

This is currently a personal project for campus networking. Future collaboration opportunities will be considered as the project grows.

## 📞 Contact

For questions or suggestions about VoxCampus:
- GitHub: [@AdiArtifice](https://github.com/AdiArtifice)
- Project Repository: [VoxCampus](https://github.com/AdiArtifice/github-webstorm-demo)

---

**Building connections, one campus at a time.** 🌟

## 🔄 How to Update

Replace your current README.md with the content above and commit the changes:

```bash
git add README.md
git commit -m "📝 Update README for VoxCampus project"
git push origin main
```