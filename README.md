# 🏠 **Hostel-RoomMate-Sync**

A comprehensive web-based system for managing hostel room allocation with mutual roommate preferences at VIT Bhopal.

## 🌟 Features

### 👨‍🎓 Student Features
- **Secure Authentication**: Student login with registration number
- **Mutual Roommate Selection**: Choose preferred roommates with real-time validation
- **Request Management**: Accept/decline roommate requests
- **Status Tracking**: Monitor form submission and commitment status
- **Room Allocation**: View final assigned room numbers
- **Responsive Dashboard**: Mobile-friendly interface

### 👨‍🏫 Warden Features
- **Student Management**: Bulk upload students via Excel
- **Time Window Control**: Set mutual preference submission periods
- **Report Generation**: Download comprehensive mutual sharing reports
- **Final Room Allocation**: Upload final room assignments
- **Warden Management**: Add, edit, and manage wardens
- **Data Management**: Delete students, preferences, and allocations

### 🔧 Technical Features
- **Real-time Validation**: Instant roommate lookup and validation
- **Excel Integration**: Import/export data with proper templates
- **Color-coded Reports**: Visual grouping in generated reports
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Database**: Scalable data storage
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mutual-hostel-room-manager.git
   cd mutual-hostel-room-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/mutual-hostel-manager
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Access the application**
   - Open `http://localhost:5000` in your browser
   - Navigate to the frontend folder and open `index.html`

## 📁 Project Structure

```
mutual-hostel-room-manager/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   └── authController.js     # Authentication logic
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authentication
│   ├── models/
│   │   ├── Student.js           # Student data model
│   │   ├── Warden.js            # Warden data model
│   │   ├── RoommateRequest.js   # Roommate request model
│   │   └── TimeWindow.js        # Time window model
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── studentRoutes.js     # Student management routes
│   │   └── wardenRoutes.js      # Warden management routes
│   └── server.js                # Main server file
├── frontend/
│   ├── css/
│   │   └── styles.css           # Main stylesheet
│   ├── js/
│   │   ├── auth.js              # Authentication logic
│   │   ├── student.js           # Student dashboard logic
│   │   └── warden.js            # Warden dashboard logic
│   ├── student/
│   │   └── Student_dashboard.html
│   ├── warden/
│   │   └── Warden_dashboard.html
│   ├── index.html               # Landing page
│   ├── student_login.html       # Student login
│   └── warden_login.html        # Warden login
```

## 🔐 Authentication

### Student Login
- **Email**: Student's email address
- **Password**: Registration number (automatically hashed)

### Warden Login
- **Email**: Warden's email address
- **Password**: Set by administrator

## 📊 Usage Guide

### For Wardens

1. **Upload Students**
   - Go to "Upload Students" section
   - Download the template Excel file
   - Fill in student details (name, email, regno, bed type)
   - Upload the file

2. **Set Time Window**
   - Navigate to "Set Time Window"
   - Set start and end dates for mutual preference submission
   - Students can only submit preferences during this period

3. **Generate Reports**
   - Go to "Download Report"
   - Generate comprehensive mutual sharing report
   - Report includes color-coded groups and status

4. **Final Room Allocation**
   - Upload final room allotment Excel file
   - Students can view their assigned rooms

### For Students

1. **Submit Preferences**
   - Login with registration number
   - Go to "Mutual Form" section
   - Enter preferred roommate registration numbers
   - Submit preferences

2. **Respond to Requests**
   - Check "Requests" section for incoming requests
   - Accept or decline roommate requests
   - View your current roommate group

3. **View Final Allocation**
   - Check "Final Allotment" section
   - View your assigned room number

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Student Routes
- `POST /api/students/upload` - Upload students (warden only)
- `POST /api/students/mutual-preference` - Submit preferences
- `GET /api/students/pending-requests` - Get pending requests
- `POST /api/students/respond-to-request/:id` - Respond to request
- `GET /api/students/status` - Get student status
- `GET /api/students/me` - Get current student data

### Warden Routes
- `POST /api/warden/add` - Add new warden
- `GET /api/warden/all` - Get all wardens
- `POST /api/warden/set-time-window` - Set time window
- `GET /api/warden/download-report` - Download report

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Adding Wardens
```bash
npm run add-wardens
```

### Database Reset
The system includes endpoints to delete all data:
- Delete all students
- Delete all preferences
- Delete all room allocations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For any feedback or support:
- Instagram: [@itsmeshubh1008](https://www.instagram.com/itsmeshubh1008)

## 🎯 Future Enhancements

- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Room availability tracking
- [ ] Payment integration
- [ ] Maintenance requests

---

**Built with ❤️ for VIT Bhopal** 
