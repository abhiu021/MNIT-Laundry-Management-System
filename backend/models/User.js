const mongoose = require('mongoose');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    validate: {
      validator: function(v) {
        if (this.role === 'student') {
          // For students, email must be @mnit.ac.in domain
          return validator.isEmail(v) && v.endsWith('@mnit.ac.in');
        }
        // For staff and admin, any valid email
        return validator.isEmail(v);
      },
      message: props => `${props.value} is not a valid email. Students must use @mnit.ac.in email.`
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  roomNumber: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'staff'],
    default: 'student',
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: function() { return this.role === 'student'; }
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  contactNumber: {
    type: String,
  },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);