const Leave = require('../models/leaveModel');
const { comparePasswords } = require('../middleware/hashPassword');
const { generateToken } = require('../utils/jwt');
const { getUserByEmail } = require('../models/leaveModel');



exports.login = async (request, h) => {
  const { email, password } = request.payload;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return h.response({ error: 'Invalid email or password' }).code(401);
    }

    const isMatch = await comparePasswords(password, user.password);
    console.log("Password match result:", isMatch);
    if (!isMatch) {
      return h.response({ error: 'Invalid email or password' }).code(401);
    }

    const token = generateToken(user);

    return h.response({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return h.response({ error: 'Internal server error' }).code(500);
  }
};

// exports.getAllusers = async (request, h) => {
//   try {
//     const users = await Leave.getAllusers();
//     return h.response(users).code(200);
//   }
//   catch (error) {
//     console.log("Error fetching users:", error.message);
//     return h.response({ error: "Internal Server Error" }).code(500);
//   }
// };

// controllers/authController.js












exports.getUserById = async (request, h) => {
  try {
    const userId = request.params.id;
    console.log("User ID from params:", userId);

    const user = await Leave.getUserById(userId);
    console.log("User fetched from DB:", user);

    if (!user) {
      return h.response({ message: "User not found" }).code(404);
    }

    return h.response(user).code(200);
  } catch (error) {
    console.error("Error fetching user by ID:", error.message); // Log full error message
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

exports.getRemainingLeave = async (request, h) => {
  try {
    const RemainingLeave = await Leave.getRemainingLeave();
    return h.response(RemainingLeave).code(200);

  }
  catch (error) {
    console.log("Error fetching remaining leave:", error.message);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
}


exports.getRemainingLeaveById = async (request, h) => {
  try {
    const userId = request.params.userId;
    const leaveBalance = await Leave.getRemainingLeaveById(userId);
    return h.response(leaveBalance).code(200);
  } catch (error) {
    console.log("Error fetching leave balance:", error.message);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};









exports.getLeaveType = async (request, h) => {
  try {
    const types = await Leave.getAllLeaveTypes();
    return h.response(types).code(200);
  } catch (err) {
    console.error('Error in getLeaveType:', err.message);
    return h.response({ error: 'Internal Server error' }).code(500);
  }
};



exports.createLeaveRequest = async (request, h) => {
  try {
    const userId = request.params.userId;
    const { type_id, leave_start_date, leave_end_date, reason } = request.payload;

    const result = await Leave.createLeaveRequest({
      userId,
      type_id,
      leave_start_date,
      leave_end_date,
      reason
    });

    return h
      .response({
        message: "Leave Request submitted successfully",
        leave_request_id: result.insertId,
      })
      .code(201);
  } catch (error) {
    console.error("Error creating leave request:", error.message);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};


exports.getLeaveRequestrole = async (request, h) => {
  try {
    const { role_id } = request.params;

    const leaveRequests = await Leave.getLeaveRequestsByRoleId(role_id);
    return h.response(leaveRequests).code(200);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return h.response({ error: "Internal Server Error" }).code(500);
  }
};

exports.updateLeaveApproval = async (request, h) => {
  try {
    const { requestId, role, status } = request.payload;

    const result = await Leave.updateLeaveWithApproval({ requestId, role, status });
    return h.response(result).code(200);
  } catch (err) {
    console.error("Error in approval update:", err);
    return h.response({ error: err.message }).code(500);
  }
};












