const LeaveController = require('../controllers/leave.controller');


module.exports = [
  // {
  //   method: 'GET',
  //   path: '/getuser',   
  //   handler: LeaveController.getAllusers,

  // },


  {
    method: 'POST',
    path: '/api/login',  //login 
    handler: LeaveController.login
  }

  ,

  {
    method: 'GET',
    path: '/users/{id}', //spefic user
    handler: LeaveController.getUserById
  },
  {
    method: 'GET',
    path: '/leaveBalance',  //remaining leave query
    handler: LeaveController.getRemainingLeave
  },

  {
    method: 'GET',
    path: '/leaveBalance/{userId}', // specific user leave balance
    handler: LeaveController.getRemainingLeaveById
  },


  {
    method: 'GET',
    path: '/leaveType',
    handler: LeaveController.getLeaveType
  }
  ,



  {
    method: "POST",  // user leave request 
    path: '/userLeaveRequest/{userId}',
    handler: LeaveController.createLeaveRequest

  },

  {
    method: "GET",
    path: "/getLeaveRequest/{role_id}",  //manager /hr/director can able to get the request leave from user
    handler: LeaveController.getLeaveRequestrole
  },

  {
    method: "PUT",
    path: "/leaveApproval",
    handler: LeaveController.updateLeaveApproval,
  }




];

