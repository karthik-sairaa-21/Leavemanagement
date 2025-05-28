const { getDB } = require('../config/db');


exports.getAllusers = async () => {
  const db = getDB(); // Safe DB access
  const [result] = await db.query(`SELECT * FROM users`);
  return result;

};
 
exports.getUserById =async(userId)=>{
  const db=getDB();
  const [result]=await db.query(`SELECT * FROM users WHERE user_id = ?`,[userId]);
  return result[0];
}



exports.getRemainingLeaveById = async (userId) => {
  const db = getDB();
  const [result] = await db.query(`SELECT * FROM leave_balance WHERE user_id = ?`, [userId]);
  return result;
};

exports.getLeaveRequest =async (userId) =>{
const db=getDB();
const [result] = await db.query(`SELECT * FROM leave_requests WHERE user_id = ?`, [userId]);
return result;
}



// exports.getLeaveType= async()=>{
//   const db=getDB();
//   const [result]=await db.query(`select * from leave_types`);
//   return result;
// }


exports.getUserByEmail = async (email) => {
  const [rows] = await getDB().query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0];
};

exports.getAllLeaveTypes = async () => {
  const db = await getDB();
  const [rows] = await db.execute('SELECT type_id, type_name, total_days_allowed FROM leave_types');
  return rows;
};
















exports.createLeaveRequest = async ({ userId, type_id, leave_start_date, leave_end_date, reason }) => {
  const db = getDB();

  // 1. Convert dates
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
         OR (? BETWEEN leave_start_date AND leave_end_date))`,
    [
      userId,
      leave_start_date, leave_end_date,
      leave_start_date, leave_end_date,
      leave_start_date,
      leave_end_date
    ]
  );

  if (duplicateCheck.length > 0) {
    const error = new Error("You cannot use the leave date because it is duplicate");
    error.statusCode = 400;
    throw error;
  }

  // 2. Calculate leave days
  const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // 3. Get leave type details
  const [typeResult] = await db.query("SELECT * FROM leave_types WHERE type_id = ?", [type_id]);
  if (typeResult.length === 0) throw new Error("Invalid leave type");

  const { type_name, total_days_allowed } = typeResult[0];

  // 4. Set default statuses
  let manager_status = "PENDING";
  let hr_status = "PENDING";
  let director_status = "PENDING";
  let overall_status = "PENDING";

  // 5. Auto-approval logic for sick leave 1 day
  if (type_name === "Sick" && leaveDays === 1) {
    manager_status = hr_status = director_status = overall_status = "APPROVED";
    await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
  }

  // 6. Insert leave request
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

//   // 1. Calculate leave days
//   const start = new Date(leave_start_date);
//   const end = new Date(leave_end_date);
//   const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

//   // 2. Get leave type details
//   const [typeResult] = await db.query("SELECT * FROM leave_types WHERE type_id = ?", [type_id]);
//   if (typeResult.length === 0) throw new Error("Invalid leave type");

//   const { type_name, total_days_allowed } = typeResult[0];

//   // 3. Set default statuses
//   let manager_status = "PENDING";
//   let hr_status = "PENDING";
//   let director_status = "PENDING";
//   let overall_status = "PENDING";

//   // 4. Auto-approval logic
//   if ( type_name === "Sick" && leaveDays === 1) {
//     manager_status = hr_status = director_status = overall_status = "APPROVED";
//     await updateLeaveBalance(db, userId, type_id, leaveDays, total_days_allowed);
//   }

//   // 5. Insert leave request
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




exports.getLeaveRequestsByRoleId = async (roleId) => {
  const connection = await getDB();
  const query = `
    SELECT lr.*
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.user_id
    WHERE u.manager_id = ? OR u.hr_id = ? OR u.director_id = ?
  `;
  const [rows] = await connection.execute(query, [roleId, roleId, roleId]);
  return rows;
};


exports.updateLeaveWithApproval = async ({ requestId, role, status }) => {
  const db = getDB();

  // 1. Get the leave request
  const [leaveResult] = await db.query("SELECT * FROM leave_requests WHERE leave_request_id = ?", [requestId]);
  if (leaveResult.length === 0) throw new Error("Leave request not found");
  const leave = leaveResult[0];

  // 2. Determine which status to update
  let roleColumn;
  if (role === "MANAGER") roleColumn = "manager_status";
  else if (role === "HR") roleColumn = "hr_status";
  else if (role === "DIRECTOR") roleColumn = "director_status";
  else throw new Error("Invalid role");

  // 3. Update the status
  await db.query(`UPDATE leave_requests SET ${roleColumn} = ? WHERE leave_request_id = ?`, [status, requestId]);

  // 4. Get updated leave request
  const [updatedRes] = await db.query("SELECT * FROM leave_requests WHERE leave_request_id = ?", [requestId]);
  const updated = updatedRes[0];

  // 5. If any rejection, reject overall
  if (
    updated.manager_status === "REJECTED" ||
    updated.hr_status === "REJECTED" ||
    updated.director_status === "REJECTED"
  ) {
    await db.query("UPDATE leave_requests SET overall_status = 'REJECTED' WHERE leave_request_id = ?", [requestId]);
    return { message: "Leave Rejected" };
  }

  // 6. Check for approval logic
  const start = new Date(updated.leave_start_date);
  const end = new Date(updated.leave_end_date);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const [typeRes] = await db.query("SELECT * FROM leave_types WHERE type_id = ?", [updated.type_id]);
  const { type_name, total_days_allowed } = typeRes[0];

  let requiredApprovals = 0;
  if (type_name === "Sick") {
    if (days === 2) requiredApprovals = 1;
    else if (days === 3) requiredApprovals = 2;
    else if (days >= 4) requiredApprovals = 3;
  }

  // 7. Count current approvals
  let approvedCount = 0;
  if (updated.manager_status === "APPROVED") approvedCount++;
  if (updated.hr_status === "APPROVED") approvedCount++;
  if (updated.director_status === "APPROVED") approvedCount++;

  if (approvedCount >= requiredApprovals) {
    await db.query("UPDATE leave_requests SET overall_status = 'APPROVED' WHERE leave_request_id = ?", [requestId]);
    await updateLeaveBalance(db, updated.user_id, updated.type_id, days, total_days_allowed);
    return { message: "Leave Approved and Balance Updated" };
  }

  return { message: "Approval recorded, waiting for others" };
};


async function updateLeaveBalance(db, user_id, type_id, days, total_days_allowed) {
  const [balanceRes] = await db.query(
    "SELECT * FROM leave_balance WHERE user_id = ? AND type_id = ?",
    [user_id, type_id]
  );

  if (balanceRes.length === 0) {
    // New row
    const remaining = total_days_allowed - days;
    await db.query(
      "INSERT INTO leave_balance (user_id, type_id, leave_taken, remaining_leave) VALUES (?, ?, ?, ?)",
      [user_id, type_id, days, remaining]
    );
  } else {
    // Update existing row
    const existing = balanceRes[0];
    const newTaken = existing.leave_taken + days;
    const newRemaining = existing.remaining_leave - days;
    await db.query(
      "UPDATE leave_balance SET leave_taken = ?, remaining_leave = ? WHERE bal_id = ?",
      [newTaken, newRemaining, existing.bal_id]
    );
  }
}
