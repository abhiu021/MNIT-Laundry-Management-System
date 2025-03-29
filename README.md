# MNIT Laundry Management System

A comprehensive laundry management system for MNIT hostel residents.

## Features

- User Authentication (Student, Staff, Admin)
- Booking Management
- Machine Monitoring
- Admin Dashboard
- Payment Integration

## Login Credentials

Use the following test credentials:

### Admin
- Email: admin@example.com
- Password: password123

### Student
- Email: student@mnit.ac.in
- Password: password123

### Staff
- Email: staff@example.com
- Password: password123

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   cd frontend/laundry-frontend
   npm install
   ```

2. Run backend:
   ```
   npm start
   ```

3. Run frontend (in a separate terminal):
   ```
   cd frontend/laundry-frontend
   npm start
   ```

## Admin Portal

The admin portal allows management of:
- Users
- Hostels
- Machines
- Bookings

To access admin features, log in with admin credentials and navigate to:
- Admin Dashboard: `/admin`
- Manage Machines: `/admin/machines`
- Manage Hostels: `/admin/hostels`
- Manage Users: `/admin/users` 