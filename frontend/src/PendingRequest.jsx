// import { useEffect, useState } from 'react';
// import './PendingRequest.css';

// const formatDate = (dateStr) => {
//   if (!dateStr) return 'N/A';
//   const date = new Date(dateStr);
//   return date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//   });
// };

// function PendingRequest() {
//   const [userId, setUserId] = useState(null);
//   const [leaveRequests, setLeaveRequests] = useState([]);
//   const [leaveTypes, setLeaveTypes] = useState([]);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     setUserId(localStorage.getItem('user_id'));
//   }, []);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch(`http://localhost:3000/getLeaveRequest/${userId}`);
//         const requestData = await response.json();

//         if (!response.ok) throw new Error(requestData.error || 'Failed to fetch leave requests');
//         setLeaveRequests(requestData);
//         console.log(requestData)

//         const typeResponse = await fetch(`http://localhost:3000/leaveType`);
//         const typeData = await typeResponse.json();

//         if (!typeResponse.ok) throw new Error(typeData.error || 'Failed to fetch leave types');
//         setLeaveTypes(typeData);

//       } catch (error) {
//         console.error('Fetch Error:', error);
//         setError('Unable to load data.');
//       }
//     };

//     if (userId) {
//       fetchData();
//     }
//   }, [userId]);

//   return (
//     <div className="pending-requests-container">
//       <h2 className="pending-requests-title">Pending Leave Requests</h2>
//       <div className="pending-requests-table-wrapper">
//         <table className="pending-requests-table">
//           <thead>
//             <tr>
//               <th>Leave Type</th>
//               <th>Date Requested</th>
//               <th>Reason</th>
//               <th>Submitted On</th>
//               <th>Manager Status</th>
//               <th>Hr Status</th>
//               <th>Director Status</th>
//               <th>Status</th>
//               <th>Assigned To</th>
//             </tr>
//           </thead>
//           <tbody>
//             {leaveRequests.length > 0 ? (
//               leaveRequests.map((request) => {
//                 const leaveType = leaveTypes.find((type) => type.type_id === request.type_id);
//                 const leaveTypeName = leaveType ? leaveType.type_name : 'N/A';

//                 return (
//                   <tr key={request.id}>
//                     <td>{leaveTypeName}</td>
//                     <td>
//                       {formatDate(request.leave_start_date)} to{' '}
//                       {formatDate(request.leave_end_date)}
//                     </td>
//                     <td>{request.reason}</td>
//                     <td>{formatDate(new Date())}</td>
//                     <td>{request.manager_status}</td>  
//                     <td>{request.hr_status}</td>   
//                     <td>{request.director_status}</td> 

//                     <td>{request.overall_status}</td>
//                     <td>{request.assigned_to || 'N/A'}</td>
//                   </tr>
//                 );
//               })
//             ) : (
//               <tr>
//                 <td colSpan="6" className="pending-requests-no-data">
//                   No leave requests found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//         {error && <p className="pending-requests-error">{error}</p>}
//       </div>
//     </div>
//   );
// }

// export default PendingRequest;


import { useEffect, useState } from 'react';
import './PendingRequest.css';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

function PendingRequest() {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setUserId(localStorage.getItem('user_id'));
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      console.log("Retrieved user from localStorage:", parsedUser);
      setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/getLeaveRequest/${userId}`);
        const requestData = await response.json();
        console.log(requestData);

        if (!response.ok) throw new Error(requestData.error || 'Failed to fetch leave requests');
        setLeaveRequests(requestData);

        const typeResponse = await fetch(`http://localhost:3000/leaveType`);
        const typeData = await typeResponse.json();

        if (!typeResponse.ok) throw new Error(typeData.error || 'Failed to fetch leave types');
        setLeaveTypes(typeData);
      } catch (error) {
        console.error('Fetch Error:', error);
        setError('Unable to load data.');
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleApproval = async (requestId, status) => {
    try {
      const response = await fetch(`http://localhost:3000/leaveApproval/${requestId}/${user.role}/${status}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Approval failed');
      }

      // Refresh data after approval
      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.leave_request_id === requestId
            ? {
                ...req,
                [`${user.role.toLowerCase()}_status`]: status,
                overall_status: status === 'REJECTED' ? 'REJECTED' : req.overall_status,
              }
            : req
        )
      );
    } catch (err) {
      console.error('Approval Error:', err);
      setError('Action failed.');
    }
  };

  return (
    <div className="pending-requests-container">
      <h2 className="pending-requests-title">Pending Leave Requests</h2>
      <div className="pending-requests-table-wrapper">
        <table className="pending-requests-table">
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
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => {
                const leaveType = leaveTypes.find((type) => type.type_id === request.type_id);
                const leaveTypeName = leaveType ? leaveType.type_name : 'N/A';
                const role = user?.role?.toUpperCase();

                return (
                  <tr key={request.leave_request_id}>
                    <td>{leaveTypeName}</td>
                    <td>{formatDate(request.leave_start_date)} to {formatDate(request.leave_end_date)}</td>
                    <td>{request.reason}</td>
                    <td>{formatDate(request.created_at)}</td>
                    <td>
                      {role === 'MANAGER' && request.manager_status === 'PENDING' ? (
                        <>
                          <button className="approve-btn" onClick={() => handleApproval(request.leave_request_id, 'APPROVED')}>Approve</button>
                          <button className="reject-btn" onClick={() => handleApproval(request.leave_request_id, 'REJECTED')}>Reject</button>
                        </>
                      ) : (
                        request.manager_status
                      )}
                    </td>
                    <td>
                      {role === 'HR' && request.hr_status === 'PENDING' ? (
                        <>
                          <button className="approve-btn" onClick={() => handleApproval(request.leave_request_id, 'APPROVED')}>Approve</button>
                          <button className="reject-btn" onClick={() => handleApproval(request.leave_request_id, 'REJECTED')}>Reject</button>
                        </>
                      ) : (
                        request.hr_status
                      )}
                    </td>
                    <td>
                      {role === 'DIRECTOR' && request.director_status === 'PENDING' ? (
                        <>
                          <button className="approve-btn" onClick={() => handleApproval(request.leave_request_id, 'APPROVED')}>Approve</button>
                          <button className="reject-btn" onClick={() => handleApproval(request.leave_request_id, 'REJECTED')}>Reject</button>
                        </>
                      ) : (
                        request.director_status
                      )}
                    </td>
                    <td>{request.overall_status}</td>
                    <td>{request.assigned_to || 'N/A'}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="pending-requests-no-data">No leave requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
        {error && <p className="pending-requests-error">{error}</p>}
      </div>
    </div>
  );
}

export default PendingRequest;
