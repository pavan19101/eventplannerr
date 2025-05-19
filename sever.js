const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace with your Twilio credentials
const accountSid = 'ACe5925cb22e46c15cc79758108de6136d';
const authToken = '[AuthToken]';
const client = require('twilio')(accountSid, authToken);

client.verify.v2.services("VAe15e04617e95a907dce0195cd8001657")
      .verificationChecks
      .create({to: '', code: '[Code]'})
      .then(verification_check => console.log(verification_check.status));

// Store OTPs in memory (for demo only)
const otpStore = {};

app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[phone] = otp;

  try {
    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: twilioPhone,
      to: `+91${phone}` // Change country code if needed
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (otpStore[phone] === otp) {
    delete otpStore[phone];
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));

let otpSent = false;

document.getElementById('send-otp').addEventListener('click', function() {
  const phone = document.getElementById('signup-phone').value.trim();
  if (!/^\d{10}$/.test(phone)) {
    document.getElementById('signup-message').textContent = 'Enter a valid 10-digit phone number.';
    return;
  }
  fetch('http://localhost:3000/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById('signup-message').textContent = 'OTP sent to your phone.';
      document.getElementById('otp-section').style.display = 'block';
      document.getElementById('signup-btn').disabled = false;
      otpSent = true;
    } else {
      document.getElementById('signup-message').textContent = 'Failed to send OTP.';
    }
  });
});

document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('signup-username').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const otp = document.getElementById('signup-otp').value.trim();

  if (!username || !phone || !password || !confirmPassword || !otp) {
    document.getElementById('signup-message').textContent = 'Please fill all fields and enter OTP.';
    return;
  }
  if (password !== confirmPassword) {
    document.getElementById('signup-message').textContent = 'Passwords do not match.';
    return;
  }
  if (!otpSent) {
    document.getElementById('signup-message').textContent = 'Please request OTP first.';
    return;
  }
  fetch('http://localhost:3000/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('eventplanner_username', username);
      localStorage.setItem('eventplanner_password', password);
      localStorage.setItem('eventplanner_phone', phone);
      document.getElementById('signup-message').textContent = 'Sign up successful! Redirecting to login...';
      setTimeout(() => {
        window.location.href = 'p2.html';
      }, 1200);
    } else {
      document.getElementById('signup-message').textContent = 'Invalid OTP.';
    }
  });
});
