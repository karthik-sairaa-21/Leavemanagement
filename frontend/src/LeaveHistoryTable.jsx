// import React from 'react';

// const formatDate = (dateStr) => {
//   if (!dateStr) return 'N/A';
//   const date = new Date(dateStr);
//   // console.log(date)
//   return date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: 'short',
//     // year: 'numeric',
//   });
// };

// const user=localStorage.getItem('user_id')



// const LeaveHistoryTable = ({ leaveRequest, leaveTypes }) => {
//   return (
//     <div className='table-leave-history'>
//       <table className="leave-table">
//         <thead>
//           <tr>
//             <th>Leave Type</th>
//             <th>Date Requested</th>
//             <th>Reason</th>
//             <th>Submitted On</th>
//             <th>Manager Status</th>
//             <th>HR Status</th>
//             <th>Director Status</th>
//             <th>Overall_Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {Array.isArray(leaveRequest) && leaveRequest.length > 0 ? (
//             leaveRequest.map((request) => {
//               const leaveType = leaveTypes.find(type => type.type_id === request.type_id);
//               const leaveTypeName = leaveType ? leaveType.type_name : 'N/A';

//               return (
//                 <tr key={request.id}>
//                   <td>{leaveTypeName}</td>
//                   <td>{formatDate(request.leave_start_date)} to {formatDate(request.leave_end_date)}</td>
//                   <td>{request.reason}</td>
//                   <td>{formatDate(new Date())}</td>
//                   <td>{request.manager_status || 'N/A'}</td>
//                   <td>{request.hr_status || 'N/A'}</td>
//                    <td>{request.director_status || 'N/A'}</td>
//                   <td>{request.overall_status}</td>
//                 </tr>
//               );
//             })
//           ) : (
//             <tr>
//               <td colSpan="8" className="no-leave-message">No leave requests found.</td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default LeaveHistoryTable;



// import React from 'react';

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

  console.log("Logged in role:", role);




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

    if (role === 'EMPLOYEE') {
      row.push(<td key="manager">{request.manager_status || 'N/A'}</td>);
      row.push(<td key="hr">{request.hr_status || 'N/A'}</td>);
      row.push(<td key="director">{request.director_status || 'N/A'}</td>);
    } else if (role === 'MANAGER') {
      row.push(<td key="hr">{request.hr_status || 'N/A'}</td>);
      row.push(<td key="director">{request.director_status || 'N/A'}</td>);
    } else if (role === 'HR') {
      row.push(<td key="director">{request.director_status || 'N/A'}</td>);
    }

    row.push(<td key="overall">{request.overall_status || 'N/A'}</td>);
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
