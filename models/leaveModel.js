const { getDB } = require('../config/db');

const { generateHash } = require("../middleware/hashPassword");



exports.getUserByEmail = async (email) => {
  const [rows] = await getDB().query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

exports.getUserById = async (userId) => {
  const db = getDB();
  const [result] = await db.query(`SELECT * FROM users WHERE user_id = ?`, [userId]);
  return result[0];
}


exports.getRemainingLeaveById = async (userId) => {
  const db = getDB();
  const [result] = await db.query(`SELECT * FROM leave_balance WHERE user_id = ?`, [userId]);
  return result;
};



exports.getAllLeaveTypes = async () => {
  const db = await getDB();
  const [rows] = await db.execute('SELECT type_id, type_name, total_days_allowed FROM leave_types');
  return rows;
};




exports.getLeaveRequest = async (userId) => {
  const db = getDB();
  const [result] = await db.query(
    `SELECT * FROM leave_requests WHERE user_id = ? ORDER BY leave_request_id DESC`,
    [userId]
  );
  return result;
};




exports.getLeaveRequestsByRoleId = async (roleId) => {
  const connection = await getDB();
  const query = `
  SELECT lr.*
  FROM leave_requests lr
  JOIN users u ON lr.user_id = u.user_id
  WHERE 
    (u.manager_id = ? AND lr.manager_status = 'PENDING')
    OR (u.hr_id = ? AND lr.hr_status = 'PENDING')
    OR (u.director_id = ? AND lr.director_status = 'PENDING')
`;
  const [rows] = await connection.execute(query, [roleId, roleId, roleId]);
  return rows;
};


exports.getApprovedRequest = async (roleId) => {
  const connection = await getDB();
  const query = `
     SELECT 
  lr.leave_request_id,
  lr.user_id,
  lr.leave_start_date,
  lr.leave_end_date,
  lr.overall_status,
  u.name AS employee_name
FROM leave_requests lr
JOIN users u ON lr.user_id = u.user_id
WHERE (
    u.manager_id = ? OR 
    u.hr_id = ? OR 
    u.director_id = ?
) AND lr.overall_status = 'APPROVED';
  `;
  const [rows] = await connection.execute(query, [roleId, roleId, roleId]);
  return rows;  // for calendar
};





function getWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    console.log(day) // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}






exports.createLeaveRequest = async ({ userId, type_id, leave_start_date, leave_end_date, reason }) => {
  const db = getDB();

  const start = new Date(leave_start_date);
  const end = new Date(leave_end_date);

  if (start > end) {
    const error = new Error("Start date must be before end date");
    error.statusCode = 400;
    throw error;
  }

  const [duplicateCheck] = await db.query(
    `SELECT * FROM leave_requests 
     WHERE user_id = ? 
       AND ((leave_start_date BETWEEN ? AND ?) 
         OR (leave_end_date BETWEEN ? AND ?)
         OR (? BETWEEN leave_start_date AND leave_end_date)
         OR (? BETWEEN leave_start_date AND leave_end_date))
       AND overall_status IN ('PENDING', 'APPROVED')`,
    [userId, leave_start_date, leave_end_date, leave_start_date, leave_end_date, leave_start_date, leave_end_date]
  );
  if (duplicateCheck.length > 0) {
    const error = new Error("Duplicate leave request for selected dates");
    error.statusCode = 400;
    throw error;
  }

const leaveDays = getWorkingDays(start, end);
  console.log("leaveDays",leaveDays)
  

  const [userRows] = await db.query("SELECT role FROM users WHERE user_id = ?", [userId]);
  if (userRows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const role = userRows[0].role.toUpperCase();

  const [typeResult] = await db.query("SELECT * FROM leave_types WHERE type_id = ?", [type_id]);
  if (typeResult.length === 0) throw new Error("Invalid leave type");

  const { type_name, total_days_allowed } = typeResult[0];

  const [balanceRows] = await db.query(
    "SELECT * FROM leave_balance WHERE user_id = ? AND type_id = ?",
    [userId, type_id]
  );
  let currentBalance = balanceRows.length ? balanceRows[0].remaining_leave : null;
  const availableBalance = currentBalance !== null ? currentBalance : total_days_allowed;

  if (currentBalance === null) {
    await db.query(
      `INSERT INTO leave_balance (user_id, type_id, leave_taken, remaining_leave) VALUES (?, ?, ?, ?)`,
      [userId, type_id, 0, total_days_allowed]
    );
  }

  // Default statuses
  let manager_status = "PENDING";
  let hr_status = "NOT_APPLICABLE";
  let director_status = "NOT_APPLICABLE";
  let overall_status = "PENDING";

  // Calculate required approval levels
  let levelsNeeded = 1;
  if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 1) {
    levelsNeeded = 1;
  } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 3) {
    levelsNeeded = 2;
  } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays > 3) {
    levelsNeeded = 3;
  }

  if (type_name === "Sick") {
    if (leaveDays === 1 && availableBalance >= 1) levelsNeeded = 1;
    else if (leaveDays <= 4 && availableBalance >= leaveDays) levelsNeeded = 2;
    else levelsNeeded = 3;
  }

  // 💼 EMPLOYEE
  if (role === "EMPLOYEE") {
    if (type_name === "Sick" && leaveDays === 1 && availableBalance >= 1) {
      manager_status = hr_status = director_status = overall_status = "APPROVED";
      await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
    } else {
      manager_status = "PENDING";

      if (levelsNeeded === 1) {
        hr_status = "NOT_APPLICABLE";
        director_status = "NOT_APPLICABLE";
      } else if (levelsNeeded === 2) {
        hr_status = "WAITING_FOR_L1_APPROVAL";
        director_status = "NOT_APPLICABLE";
      } else {
        hr_status = "WAITING_FOR_L1_APPROVAL";
        director_status = "WAITING_FOR_L2_APPROVAL";
      }
    }
  }

  // 👔 MANAGER
  else if (role === "MANAGER") {
    manager_status = "APPROVED";

    if (type_name === "Sick" && leaveDays === 1 && availableBalance >= 1) {
      hr_status = director_status = overall_status = "APPROVED";
      await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
    } else {
      if (levelsNeeded === 1) {
        hr_status = "NOT_APPLICABLE";
        director_status = "NOT_APPLICABLE";
      } else if (levelsNeeded === 2) {
        hr_status = "PENDING";
        director_status = "NOT_APPLICABLE";
      } else {
        hr_status = "PENDING";
        director_status = "WAITING_FOR_L2_APPROVAL";
      }
    }
  }

  // 🧑‍💼 HR
  else if (role === "HR") {
    manager_status = "APPROVED";
    hr_status = "APPROVED";

    if (type_name === "Sick" && leaveDays === 1 && availableBalance >= 1) {
      director_status = "APPROVED";
      overall_status = "APPROVED";
      await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
    } else {
      if (levelsNeeded === 1 || levelsNeeded === 2) {
        director_status = "NOT_APPLICABLE";
      } else {
        director_status = "PENDING";
      }
    }
  }

  // 🎩 DIRECTOR
  else if (role === "DIRECTOR") {
    manager_status = "APPROVED";
    hr_status = "APPROVED";
    director_status = "APPROVED";
    overall_status = "APPROVED";
    await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
  }

  const [result] = await db.query(
    `INSERT INTO leave_requests 
     (user_id, type_id, leave_start_date, leave_end_date, reason,
      manager_status, hr_status, director_status, overall_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      type_id,
      leave_start_date,
      leave_end_date,
      reason,
      manager_status,
      hr_status,
      director_status,
      overall_status,
    ]
  );

  return result;
};



// exports.approveLeaveRequest = async ({ requestId, role, status }) => {
//   const db = getDB();

//   // Fetch leave request with leave type info
//   const [rows] = await db.query(`
//     SELECT lr.*, lt.type_name 
//     FROM leave_requests lr 
//     JOIN leave_types lt ON lr.type_id = lt.type_id 
//     WHERE leave_request_id = ?
//   `, [requestId]);

//   if (rows.length === 0) throw new Error("Leave request not found");

//   const request = rows[0];
//   const {
//     user_id,
//     type_id,
//     leave_start_date,
//     leave_end_date,
//     manager_status,
//     hr_status,
//     director_status,
//     type_name,
//   } = request;

//   const leaveDays = Math.ceil((new Date(leave_end_date) - new Date(leave_start_date)) / (1000 * 60 * 60 * 24)) + 1;

//   // Determine levels needed (same as createLeaveRequest)
//   let levelsNeeded = 1;
//   if (type_name === "Casual" || type_name === "Earned") {
//     if (leaveDays === 1) levelsNeeded = 1;
//     else if (leaveDays <= 3) levelsNeeded = 2;
//     else levelsNeeded = 3;
//   } else if (type_name === "Sick") {
//     if (leaveDays === 1) levelsNeeded = 0; // auto-approved at creation, so no approval needed here
//     else if (leaveDays === 2) levelsNeeded = 1;
//     else if (leaveDays <= 4) levelsNeeded = 2;
//     else levelsNeeded = 3;
//   } else {
//     levelsNeeded = 1; // Default fallback
//   }

//   // Handle REJECTION
//   if (status === "REJECTED") {
//     let updateField = "";
//     if (role === "MANAGER") updateField = "manager_status";
//     else if (role === "HR") updateField = "hr_status";
//     else if (role === "DIRECTOR") updateField = "director_status";
//     else throw new Error("Invalid role for rejection");

//     await db.query(
//       `UPDATE leave_requests SET ${updateField} = 'REJECTED', overall_status = 'REJECTED' WHERE leave_request_id = ?`,
//       [requestId]
//     );

//     return { message: `${role} rejected the leave` };
//   }

//   // Handle APPROVAL
//   if (role === "MANAGER" && manager_status === "PENDING") {
//     // Manager approves
//     let updates = [`manager_status = 'APPROVED'`];

//     if (levelsNeeded === 1) {
//       // If only manager approval needed, overall approved immediately
//       updates.push(`overall_status = 'APPROVED'`);
//       await updateLeaveBalance(db, user_id, type_id, leaveDays);
//     } else {
//       // If more levels needed, HR moves from WAITING to PENDING
//       if (hr_status === "WAITING_FOR_L1_APPROVAL" || hr_status === "NOT_APPLICABLE") {
//         updates.push(`hr_status = 'PENDING'`);
//       }
//     }

//     await db.query(`UPDATE leave_requests SET ${updates.join(", ")} WHERE leave_request_id = ?`, [requestId]);

//   } else if (role === "HR" && hr_status === "PENDING") {
//     // HR approves
//     let updates = [`hr_status = 'APPROVED'`];

//     if (levelsNeeded === 2) {
//       // If HR is final approver, approve overall
//       updates.push(`overall_status = 'APPROVED'`);
//       await updateLeaveBalance(db, user_id, type_id, leaveDays);
//     } else if (levelsNeeded === 3) {
//       // Director moves from WAITING to PENDING on HR approval
//       if (director_status === "WAITING_FOR_L2_APPROVAL" || director_status === "NOT_APPLICABLE") {
//         updates.push(`director_status = 'PENDING'`);
//       }
//     }

//     await db.query(`UPDATE leave_requests SET ${updates.join(", ")} WHERE leave_request_id = ?`, [requestId]);

//   } else if (role === "DIRECTOR" && director_status === "PENDING") {
//     // Director approves - final approval
//     await db.query(
//       `UPDATE leave_requests 
//        SET director_status = 'APPROVED', overall_status = 'APPROVED' 
//        WHERE leave_request_id = ?`,
//       [requestId]
//     );
//     await updateLeaveBalance(db, user_id, type_id, leaveDays);

//   } else {
//     throw new Error("Invalid approval flow or already approved");
//   }

//   return { message: `${role} approved the leave` };
// };





// 🔧 Helper to count actual working days (excluding Sat & Sun)


exports.approveLeaveRequest = async ({ requestId, role, status }) => {
  const db = getDB();

  const [rows] = await db.query(`
    SELECT lr.*, lt.type_name 
    FROM leave_requests lr 
    JOIN leave_types lt ON lr.type_id = lt.type_id 
    WHERE leave_request_id = ?
  `, [requestId]);

  if (rows.length === 0) throw new Error("Leave request not found");

  const request = rows[0];
  const {
    user_id,
    type_id,
    leave_start_date,
    leave_end_date,
    manager_status,
    hr_status,
    director_status,
    type_name,
  } = request;

  const start = new Date(leave_start_date);
  const end = new Date(leave_end_date);
  const leaveDays = getWorkingDays(start, end); // ✅ updated logic

  // Determine approval levels
  let levelsNeeded = 1;
  if (type_name === "Casual" || type_name === "Earned") {
    if (leaveDays === 1) levelsNeeded = 1;
    else if (leaveDays <= 3) levelsNeeded = 2;
    else levelsNeeded = 3;
  } else if (type_name === "Sick") {
    if (leaveDays === 1) levelsNeeded = 0;
    else if (leaveDays === 2) levelsNeeded = 1;
    else if (leaveDays <= 4) levelsNeeded = 2;
    else levelsNeeded = 3;
  }

  // 💢 Handle rejection
  if (status === "REJECTED") {
    let updateField = "";
    if (role === "MANAGER") updateField = "manager_status";
    else if (role === "HR") updateField = "hr_status";
    else if (role === "DIRECTOR") updateField = "director_status";
    else throw new Error("Invalid role for rejection");

    await db.query(
      `UPDATE leave_requests 
       SET ${updateField} = 'REJECTED', overall_status = 'REJECTED' 
       WHERE leave_request_id = ?`,
      [requestId]
    );
    return { message: `${role} rejected the leave` };
  }

  // ✅ Handle approval
  if (role === "MANAGER" && manager_status === "PENDING") {
    const updates = [`manager_status = 'APPROVED'`];

    if (levelsNeeded === 1) {
      updates.push(`overall_status = 'APPROVED'`);
      await updateLeaveBalance(db, user_id, type_id, leaveDays);
    } else {
      if (hr_status === "WAITING_FOR_L1_APPROVAL" || hr_status === "NOT_APPLICABLE") {
        updates.push(`hr_status = 'PENDING'`);
      }
    }

    await db.query(`UPDATE leave_requests SET ${updates.join(", ")} WHERE leave_request_id = ?`, [requestId]);

  } else if (role === "HR" && hr_status === "PENDING") {
    const updates = [`hr_status = 'APPROVED'`];

    if (levelsNeeded === 2) {
      updates.push(`overall_status = 'APPROVED'`);
      await updateLeaveBalance(db, user_id, type_id, leaveDays);
    } else if (levelsNeeded === 3) {
      if (director_status === "WAITING_FOR_L2_APPROVAL" || director_status === "NOT_APPLICABLE") {
        updates.push(`director_status = 'PENDING'`);
      }
    }

    await db.query(`UPDATE leave_requests SET ${updates.join(", ")} WHERE leave_request_id = ?`, [requestId]);

  } else if (role === "DIRECTOR" && director_status === "PENDING") {
    await db.query(
      `UPDATE leave_requests 
       SET director_status = 'APPROVED', overall_status = 'APPROVED' 
       WHERE leave_request_id = ?`,
      [requestId]
    );
    await updateLeaveBalance(db, user_id, type_id, leaveDays);

  } else {
    throw new Error("Invalid approval flow or already approved");
  }

  return { message: `${role} approved the leave` };
};


async function updateLeaveBalance(db, userId, typeId, leaveDays, totalDaysAllowed = null) {
  const [rows] = await db.query(
    "SELECT * FROM leave_balance WHERE user_id = ? AND type_id = ?",
    [userId, typeId]
  );

  if (rows.length === 0 && totalDaysAllowed !== null) {
    await db.query(
      `INSERT INTO leave_balance (user_id, type_id, leave_taken, remaining_leave) VALUES (?, ?, ?, ?)`,
      [userId, typeId, leaveDays, totalDaysAllowed - leaveDays]
    );
  } else {
    const { leave_taken, remaining_leave } = rows[0];
    await db.query(
      `UPDATE leave_balance 
       SET leave_taken = ?, remaining_leave = ? 
       WHERE user_id = ? AND type_id = ?`,
      [leave_taken + leaveDays, remaining_leave - leaveDays, userId, typeId]
    );
  }
}





//creating the user



exports.uploadUser = async (name, role, manager_id, hr_id, director_id, email, password, status) => {
  try {
    const connection = await getDB();

    // Hash the password
    const hashedPassword = await generateHash(password);

    const [result] = await connection.execute(
      `INSERT INTO users (name, role, manager_id, hr_id, director_id, email, password, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, role, manager_id, hr_id, director_id, email, hashedPassword, status]
    );

    return {
      message: "User created successfully",
      userId: result.insertId
    };
  } catch (error) {
    console.error("Error uploading user:", error);
    throw error;
  }
};


