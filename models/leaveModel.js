const { getDB } = require('../config/db');


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
    `SELECT * FROM leave_requests WHERE user_id = ? ORDER BY leave_start_date DESC`,
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



exports.createLeaveRequest = async ({ userId, type_id, leave_start_date, leave_end_date, reason, user }) => {
  const db = getDB();

  const start = new Date(leave_start_date);
  const end = new Date(leave_end_date);

  if (start > end) {
    const error = new Error("Start date must be before end date");
    error.statusCode = 400;
    throw error;
  }

  // Check for overlapping leave
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

  const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const [userRows] = await db.query("SELECT role FROM users WHERE user_id = ?", [userId]);
  if (userRows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const role = userRows[0].role.toUpperCase();
  console.log("role daa", role);



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

  // const role = user.role.toUpperCase();

if (role === "EMPLOYEE") {
  if (type_name === "Sick" && leaveDays === 1 && availableBalance >= 1) {
    manager_status = hr_status = director_status = overall_status = "APPROVED";
    await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
  } else {
    let levelsNeeded = 1;

    if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 1) {
      levelsNeeded = 1;
    } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 3) {
      levelsNeeded = 2;
    } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays > 3) {
      levelsNeeded = 3;
    }

    if (type_name === "Sick") {
      if (leaveDays === 2 && availableBalance >= 2) levelsNeeded = 1;
      else if (leaveDays <= 4 && availableBalance >= leaveDays) levelsNeeded = 2;
      else levelsNeeded = 3;
    }

    // On creation, only manager status is PENDING,
    // HR and Director are NOT_APPLICABLE initially
    manager_status = "PENDING";
    hr_status = "NOT_APPLICABLE";
    director_status = "NOT_APPLICABLE";

    // You can save levelsNeeded somewhere if needed for approval flow
  }
}


  else if (role === "MANAGER") {
    manager_status = "APPROVED"; // Manager auto-approves their request

    if (type_name === "Sick" && leaveDays === 1 && availableBalance >= 1) {
      hr_status = "APPROVED";
      director_status = "APPROVED";
      overall_status = "APPROVED";
      await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
    } else {
      hr_status = "PENDING";         // Always pending for manager request
      director_status = "NOT_APPLICABLE"; // Becomes PENDING after HR approves
    }
  }
  else if (role === "HR") {
    manager_status = "APPROVED"; // Auto-approved
    hr_status = "APPROVED";      // Self-approved

    if (type_name === "Sick" && leaveDays === 1 && availableBalance >= 1) {
      director_status = "APPROVED";
      overall_status = "APPROVED";
      await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
    } else {
      director_status = "PENDING"; // Always pending for HR request
    }
  }


  // Insert leave request with statuses
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








// exports.createLeaveRequest = async ({ userId, type_id, leave_start_date, leave_end_date, reason }) => {
//   const db = getDB();

//   const start = new Date(leave_start_date);
//   const end = new Date(leave_end_date);

//   if (start > end) {
//     const error = new Error("Start date must be before end date");
//     error.statusCode = 400;
//     throw error;
//   }

//   // Check for overlapping leave
//   const [duplicateCheck] = await db.query(
//     `SELECT * FROM leave_requests 
//      WHERE user_id = ? 
//        AND ((leave_start_date BETWEEN ? AND ?) 
//          OR (leave_end_date BETWEEN ? AND ?)
//          OR (? BETWEEN leave_start_date AND leave_end_date)
//          OR (? BETWEEN leave_start_date AND leave_end_date))`,
//     [userId, leave_start_date, leave_end_date, leave_start_date, leave_end_date, leave_start_date, leave_end_date]
//   );
//   if (duplicateCheck.length > 0) {
//     const error = new Error("Duplicate leave request for selected dates");
//     error.statusCode = 400;
//     throw error;
//   }

//   const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

//   const [typeResult] = await db.query("SELECT * FROM leave_types WHERE type_id = ?", [type_id]);
//   if (typeResult.length === 0) throw new Error("Invalid leave type");

//   const { type_name, total_days_allowed } = typeResult[0];

//   const [balanceRows] = await db.query(
//     "SELECT * FROM leave_balance WHERE user_id = ? AND type_id = ?",
//     [userId, type_id]
//   );
//   let currentBalance = balanceRows.length ? balanceRows[0].remaining_leave : null;
//   const availableBalance = currentBalance !== null ? currentBalance : total_days_allowed;

//   if (currentBalance === null) {
//     await db.query(
//       `INSERT INTO leave_balance (user_id, type_id, leave_taken, remaining_leave) VALUES (?, ?, ?, ?)`,
//       [userId, type_id, 0, total_days_allowed]
//     );
//   }

//   // Default statuses
//   let manager_status = "PENDING";
//   let hr_status = "NOT_APPLICABLE";
//   let director_status = "NOT_APPLICABLE";
//   let overall_status = "PENDING";

//   if (type_name === "Sick" && leaveDays === 1 && availableBalance >= 1) {
//     manager_status = hr_status = director_status = overall_status = "APPROVED";
//     await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
//   } else {
//     let levelsNeeded = 1;

//     if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 1) {
//       levelsNeeded = 1;
//     } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 3) {
//       levelsNeeded = 2;
//     } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays > 3) {
//       levelsNeeded = 3;
//     }

//     if (type_name === "Sick") {
//       if (leaveDays === 2 && availableBalance >= 2) levelsNeeded = 1;
//       else if (leaveDays <= 4 && availableBalance >= leaveDays) levelsNeeded = 2;
//       else levelsNeeded = 3;
//     }

//     if (levelsNeeded === 1) {
//       hr_status = "NOT_APPLICABLE";
//       director_status = "NOT_APPLICABLE";
//     } else if (levelsNeeded >= 2) {
//       hr_status = "NOT_APPLICABLE";        // will become PENDING after manager approves
//       director_status = "NOT_APPLICABLE";  // will become PENDING after HR approves
//     }

//   }

//   const [result] = await db.query(
//     `INSERT INTO leave_requests 
//      (user_id, type_id, leave_start_date, leave_end_date, reason,
//       manager_status, hr_status, director_status, overall_status)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       userId,
//       type_id,
//       leave_start_date,
//       leave_end_date,
//       reason,
//       manager_status,
//       hr_status,
//       director_status,
//       overall_status,
//     ]
//   );

//   return result;
// };




exports.approveLeaveRequest = async ({ requestId, role, status }) => {
  const db = getDB();

  // Fetch leave request
  const [rows] = await db.query(`SELECT lr.*, lt.type_name FROM leave_requests lr JOIN leave_types lt ON lr.type_id = lt.type_id WHERE leave_request_id = ?`, [requestId]);
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

  const leaveDays = Math.ceil((new Date(leave_end_date) - new Date(leave_start_date)) / (1000 * 60 * 60 * 24)) + 1;

  // Handle REJECTION
  if (status === "REJECTED") {
    let updateField = "";

    if (role === "MANAGER") updateField = "manager_status";
    else if (role === "HR") updateField = "hr_status";
    else if (role === "DIRECTOR") updateField = "director_status";
    else throw new Error("Invalid role for rejection");

    await db.query(
      `UPDATE leave_requests SET ${updateField} = 'REJECTED', overall_status = 'REJECTED' WHERE leave_request_id = ?`,
      [requestId]
    );

    return { message: `${role} rejected the leave` };
  }

  // Handle APPROVAL
  if (role === "MANAGER" && manager_status === "PENDING") {
    let updates = [`manager_status = 'APPROVED'`];

    // Determine how many approval levels are needed based on leave type and days
    let levelsNeeded = 1;

    if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 1) {
      levelsNeeded = 1;
    } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays <= 3) {
      levelsNeeded = 2;
    } else if ((type_name === "Casual" || type_name === "Earned") && leaveDays > 3) {
      levelsNeeded = 3;
    } else if (type_name === "Sick") {
      if (leaveDays === 2) levelsNeeded = 1;
      else if (leaveDays <= 4) levelsNeeded = 2;
      else levelsNeeded = 3;
    }

    if (levelsNeeded === 1) {
      updates.push(`overall_status = 'APPROVED'`);
      await updateLeaveBalance(db, user_id, type_id, leaveDays);
    } else if (levelsNeeded === 2) {
      updates.push(`hr_status = 'PENDING'`);
    } else if (levelsNeeded === 3) {
      updates.push(`hr_status = 'PENDING'`);
      // director_status remains NOT_APPLICABLE but will be updated when HR approves
    }

    await db.query(`UPDATE leave_requests SET ${updates.join(", ")} WHERE leave_request_id = ?`, [requestId]);
  } else if (role === "HR" && hr_status === "PENDING") {
    let updates = [`hr_status = 'APPROVED'`];

    if (director_status === "NOT_APPLICABLE") {
      updates.push(`overall_status = 'APPROVED'`);
      await updateLeaveBalance(db, user_id, type_id, leaveDays);
    } else {
      updates.push(`director_status = 'PENDING'`);
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












exports.approveLeaveRequest = async ({ requestId, role, status }) => {
  const db = getDB();

  // Fetch leave request
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

  const leaveDays = Math.ceil((new Date(leave_end_date) - new Date(leave_start_date)) / (1000 * 60 * 60 * 24)) + 1;

  // Determine levels needed
  let levelsNeeded = 1;
  if ((type_name === "Casual" || type_name === "Earned")) {
    if (leaveDays === 1) levelsNeeded = 1;
    else if (leaveDays <= 3) levelsNeeded = 2;
    else levelsNeeded = 3;
  } else if (type_name === "Sick") {
    if (leaveDays === 2) levelsNeeded = 1;
    else if (leaveDays <= 4) levelsNeeded = 2;
    else levelsNeeded = 3;
  }

  // Handle REJECTION
  if (status === "REJECTED") {
    let updateField = "";
    if (role === "MANAGER") updateField = "manager_status";
    else if (role === "HR") updateField = "hr_status";
    else if (role === "DIRECTOR") updateField = "director_status";
    else throw new Error("Invalid role for rejection");

    await db.query(
      `UPDATE leave_requests SET ${updateField} = 'REJECTED', overall_status = 'REJECTED' WHERE leave_request_id = ?`,
      [requestId]
    );

    return { message: `${role} rejected the leave` };
  }

  // Handle APPROVAL
  if (role === "MANAGER" && manager_status === "PENDING") {
    let updates = [`manager_status = 'APPROVED'`];

    if (levelsNeeded === 1) {
      updates.push(`overall_status = 'APPROVED'`);
      await updateLeaveBalance(db, user_id, type_id, leaveDays);
    } else {
      updates.push(`hr_status = 'PENDING'`);
    }

    await db.query(`UPDATE leave_requests SET ${updates.join(", ")} WHERE leave_request_id = ?`, [requestId]);

  } else if (role === "HR" && hr_status === "PENDING") {
    let updates = [`hr_status = 'APPROVED'`];

    if (levelsNeeded === 2) {
      updates.push(`overall_status = 'APPROVED'`);
      await updateLeaveBalance(db, user_id, type_id, leaveDays);
    } else if (levelsNeeded === 3) {
      // 🔥 FIX: If director_status is still NOT_APPLICABLE, update it to PENDING
      if (director_status === "NOT_APPLICABLE") {
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






// inside leaveModel.js

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
