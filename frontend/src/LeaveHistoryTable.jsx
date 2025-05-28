import React from 'react';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  // console.log(date)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    // year: 'numeric',
  });
};

const LeaveHistoryTable = ({ leaveRequest, leaveTypes }) => {
  return (
    <div className='table-leave-history'>
      <table className="leave-table">
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Date Requested</th>
            <th>Reason</th>
            <th>Submitted On</th>
            <th>Manager Status</th>
            <th>HR Status</th>
            <th>Director Status</th>
            <th>Status</th>
            {/* <th>Assigned To</th> */}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(leaveRequest) && leaveRequest.length > 0 ? (
            leaveRequest.map((request) => {
              const leaveType = leaveTypes.find(type => type.type_id === request.type_id);
              const leaveTypeName = leaveType ? leaveType.type_name : 'N/A';

              return (
                <tr key={request.id}>
                  <td>{leaveTypeName}</td>
                  <td>{formatDate(request.leave_start_date)} to {formatDate(request.leave_end_date)}</td>
                  <td>{request.reason}</td>
                  <td>{formatDate(new Date())}</td>
                  <td>{request.manager_status || 'N/A'}</td>
                  <td>{request.director_status || 'N/A'}</td>
                  <td>{request.hr_status || 'N/A'}</td>
                  <td>{request.overall_status}</td>
                  {/* <td>{request.assigned_to || 'N/A'}</td> */}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="8" className="no-leave-message">No leave requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveHistoryTable;
