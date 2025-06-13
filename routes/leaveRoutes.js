const LeaveController = require('../controllers/leaveController');
const { validateUser } = require('../middleware/authMiddleware');

module.exports = [
  // {
  //   method: 'GET',
  //   path: '/getuser',   
  //   handler: LeaveController.getAllusers,

  // },
  // {
  //   method: 'GET',
  //   path: '/leaveBalance',  //remaining leave query
  //   handler: LeaveController.getRemainingLeave
  // },
///////////////////////////////

  // {
  //   method: 'POST',
  //   path: '/api/login',  //login           (ok)
  //   handler: LeaveController.login
  // }

  // ,

  // {
  //   method: 'GET',
  //   path: '/users/{id}', //spefic user     (ok)
  //   handler: LeaveController.getUserById
  // },


  // {
  //   method: 'GET',
  //   path: '/leaveBalance/{userId}', // specific user leave balance  (ok)
  //   handler: LeaveController.getRemainingLeaveById
  // },


  // {
  //   method: 'GET',
  //   path: '/leaveType',
  //   handler: LeaveController.getLeaveType     //(ok)
  // }
  // ,

  // {
  //   method: "POST",  // user leave request          (ok)
  //   path: '/userLeaveRequest/{userId}',
  //   handler: LeaveController.createLeaveRequest

  // },
  // {
  //   method: "GET",  // user leave request      (ok)
  //   path: '/getSpecificLeaveRequest/{userId}',
  //   handler: LeaveController.getLeaveRequest

  // },

  // {
  //   method: "GET",
  //   path: "/getLeaveRequest/{role_id}",  //manager /hr/director can able to get the request leave from user
  //   handler: LeaveController.getLeaveRequestrole      //start the work from here daa
  // },

  // {
  //   method: "GET",
  //   path: "/getApprovedRequest/{role_id}",  //for calendar
  //   handler: LeaveController.getApproveRequest
  // },

  // {
  //   method: "PUT",
  //   path: "/leaveApproval/{requestId}/{role}/{status}",
  //   handler: LeaveController.updateLeaveApproval,
  // }


  // ,
  // {
  //   method: "POST",
  //   path: "/users/upload",
  //   handler: LeaveController.createUsers
  // }
  // ,
  
{
  method: 'POST',
  path: '/api/login',
  handler: LeaveController.login
},

{
  method: 'GET',
  path: '/users/{id}',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.getUserById
  }
},

{
  method: 'GET',
  path: '/leaveBalance/{userId}',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.getRemainingLeaveById
  }
},

{
  method: 'GET',
  path: '/leaveType',
  handler: LeaveController.getLeaveType
},

{
  method: 'POST',
  path: '/userLeaveRequest/{userId}',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.createLeaveRequest
  }
},

{
  method: 'GET',
  path: '/getSpecificLeaveRequest/{userId}',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.getLeaveRequest
  }
},

{
  method: 'GET',
  path: '/getLeaveRequest/{role_id}',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.getLeaveRequestrole
  }
},

{
  method: 'GET',
  path: '/getApprovedRequest/{role_id}',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.getApproveRequest
  }
},

{
  method: 'PUT',
  path: '/leaveApproval/{requestId}/{role}/{status}',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.updateLeaveApproval
  }
},

{
  method: 'POST',
  path: '/users/upload',
  options: {
    pre: [{ method: validateUser }],
    handler: LeaveController.createUsers
  }
}




];

