const LeaveController = require('../controllers/leaveController');


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


  {
    method: 'POST',
    path: '/api/login',  //login           (ok)
    handler: LeaveController.login
  }

  ,

  {
    method: 'GET',
    path: '/users/{id}', //spefic user     (ok)
    handler: LeaveController.getUserById
  },



  {
    method: 'GET',
    path: '/leaveBalance/{userId}', // specific user leave balance  (ok)
    handler: LeaveController.getRemainingLeaveById
  },


  {
    method: 'GET',
    path: '/leaveType',
    handler: LeaveController.getLeaveType     //(ok)
  }
  ,

  {
    method: "POST",  // user leave request          (ok)
    path: '/userLeaveRequest/{userId}',
    handler: LeaveController.createLeaveRequest

  },
  {
    method: "GET",  // user leave request      (ok)
    path: '/getSpecificLeaveRequest/{userId}',
    handler: LeaveController.getLeaveRequest

  },

  {
    method: "GET",
    path: "/getLeaveRequest/{role_id}",  //manager /hr/director can able to get the request leave from user
    handler: LeaveController.getLeaveRequestrole      //start the work from here daa
  },

  {
    method: "GET",
    path: "/getApprovedRequest/{role_id}",  //for calendar
    handler: LeaveController.getApproveRequest
  },

  {
    method: "PUT",
    path: "/leaveApproval/{requestId}/{role}/{status}",
    handler: LeaveController.updateLeaveApproval,
  }


  ,
  {
    method: "POST",
    path: "/users/upload",
    handler: LeaveController.createUsers
  }
  ,
  




];

