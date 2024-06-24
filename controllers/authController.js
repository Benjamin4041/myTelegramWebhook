

// theses no use for this controller

// const User = require('../models/user');
// const { startClient, startClientRegister } = require('../services/telegramService');

// const registerUser = async (req, res) => {
//   const { email, name, phoneNumber, apiId, apiHash, otp } = req.body;
//   if (!email || !name || !phoneNumber || !apiId || !apiHash) {
//     return res.status(400).send('All fields are required');
//   }

//   try {
//     let user = await User.findOne({ email });
//     if (!user) {
//       user = new User({ email, name, phoneNumber, apiId, apiHash });
//       await user.save();
//     } else {
//       user.apiId = apiId;
//       user.apiHash = apiHash;
//       await user.save();
//     }

//     await startClientRegister(user, otp);
//     res.send('User registered and client started successfully');
//   } catch (err) {
//     console.error('Error registering user:', err);
//     res.status(500).send('Error registering user');
//   }
// };

// module.exports = {
//   registerUser,
// };
