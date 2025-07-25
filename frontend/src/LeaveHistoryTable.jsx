// import React from 'react'
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
};

const LeaveHistoryTable = ({ leaveRequest, leaveTypes }) => {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const role = user?.role?.toUpperCase() ;





  const getHeaders = () => {
    const base = ['Leave Type', 'Date Requested', 'Reason', 'Submitted On'];
    if (role === 'EMPLOYEE') {
      base.push('Manager Status', 'HR Status', 'Director Status');
    } else if (role === 'MANAGER') {
      base.push('HR Status', 'Director Status');
    } else if (role === 'HR') {
      base.push('Director Status');
    }
    base.push('Overall Status');
    return base;
  };

  const renderRow = (request) => {
    const leaveType = leaveTypes.find((type) => type.type_id === request.type_id);
    const leaveTypeName = leaveType ? leaveType.type_name : 'N/A';

    const row = [
      <td key="type">{leaveTypeName}</td>,
      <td key="dates">{formatDate(request.leave_start_date)} to {formatDate(request.leave_end_date)}</td>,
      <td key="reason">{request.reason}</td>,
      <td key="submitted">{(formatDate(new Date()))}</td>,
    ];

const renderStatus = (status) => (
  <span className={`status-label ${status?.toLowerCase() || 'na'}`}>
    {status || 'N/A'}
  </span>
);

if (role === 'EMPLOYEE') {
  row.push(<td key="manager">{renderStatus(request.manager_status)}</td>);
  row.push(<td key="hr">{renderStatus(request.hr_status)}</td>);
  row.push(<td key="director">{renderStatus(request.director_status)}</td>);
} else if (role === 'MANAGER') {
  row.push(<td key="hr">{renderStatus(request.hr_status)}</td>);
  row.push(<td key="director">{renderStatus(request.director_status)}</td>);
} else if (role === 'HR') {
  row.push(<td key="director">{renderStatus(request.director_status)}</td>);
}

row.push(<td key="overall">{renderStatus(request.overall_status)}</td>);
    return <tr key={request.id}>{row}</tr>;
  };

  const headers = getHeaders();

  return (
    <div className="table-leave-history">
      <table className="leave-table">
        <thead>
          <tr>
            {headers.map((head, i) => (
              <th key={i}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(leaveRequest) && leaveRequest.length > 0 ? (
            leaveRequest.map(renderRow)
          ) : (
            <tr>
              <td colSpan={headers.length} className="no-leave-message">
                {role === 'DIRECTOR'
                  ? 'No pending approvals. You are the final approver.'
                  : 'No leave requests found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveHistoryTable;
