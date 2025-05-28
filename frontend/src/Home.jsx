// import './Home.css';
// import { useEffect, useState } from 'react';
// import LeaveRequest from './LeaveRequest';

// // For date formatDate
// const formatDate = (dateStr) => {
//   if (!dateStr) return 'N/A';
//   const date = new Date(dateStr);
//   return date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//   }); // Output example: "20 May 2025"
// };


// function Home() {
//   const [showForm, setShowForm] = useState(false);
//   const [leaveBalance, setLeaveBalance] = useState([]);
//   const [leaveTypes, setLeaveTypes] = useState([]);
//   const [leaveRequest,setLeaveRequest]=useState([]);
//   const [error, setError] = useState('');

//   const handleApplyLeaveClick = () => {
//     setShowForm(true);
//   };

//   const handleCloseForm = () => {
//     setShowForm(false);
//   };

//   const [refresh , setRefresh] = useState(0);
//   const userId = localStorage.getItem('user_id');
//   const handleRefresh = ()=>{
//     setRefresh((item)=>item+1);
//   }
//   // Fetch leave types (master data)
//   useEffect(() => {
//     const fetchLeaveTypes = async () => {
//       try {
//         const response = await fetch('http://localhost:3000/leaveType');
//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(data.error || 'Failed to fetch leave types');
//         }

//         setLeaveTypes(data);
//       } catch (err) {
//         console.error(err);
//         setError('Unable to load leave types.');
//       }
//     };

//     fetchLeaveTypes();
//   }, []);

//   // Fetch leave balance for user
//   useEffect(() => {
//     const fetchLeaveBalance = async () => {
//       try {
//         const response = await fetch(`http://localhost:3000/leaveBalance/${userId}`);
//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(data.error || 'Failed to fetch leave balance');
//         }

//         setLeaveBalance(data);
//       } catch (err) {
//         console.error(err);
//         setError('Unable to load leave balance.');
//       }
//     };

//     if (userId) {
//       fetchLeaveBalance();
//     }
//   }, [userId]);

// // fetch the leave request for table

// useEffect(() => {
//   const fetchLeaveRequest = async () => {
//     try {
//       const response = await fetch(`http://localhost:3000/getSpecificLeaveRequest/${userId}`);
//       const data = await response.json();
//       console.log(data)

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to fetch leave request');
//       }

//       setLeaveRequest(data);
//     } catch (err) {
//       console.error(err);
//       setError('Unable to load leave request.');
//     }
//   };

//   if (userId) {
//     fetchLeaveRequest();
//   }
// }, [userId ,refresh ]);









//   // Calculate used / total leave for a type
//   const getLeaveDaysUsed = (typeId) => {
//     const type = leaveTypes.find((lt) => lt.type_id === typeId);
//     if (!type) return 'N/A';

//     const total = type.total_days_allowed ?? 0;

//     const balance = leaveBalance.find((lb) => lb.type_id === typeId);
//     const remaining = balance ? balance.remaining_leave : total;
//     const used = total - remaining;

//     return `${used} / ${total}`;
//   };

//   // Map leave types to class names for cards (example)
//   const leaveTypeClassMap = {
//     'Sick Leave': 'sick-leave',
//     'Earned Leave': 'earned-leave',
//     'Casual Leave': 'casual-leave',
//   };

//   return (
//     <>
//       <div>
//         <div className='application'>
//           <h4 className="balanceleave-text">Leave Balance</h4>
//           <button className='applyLeave' onClick={handleApplyLeaveClick}>Apply Leave</button>
//         </div>

//         {error && <p className="error">{error}</p>}

//         {showForm && (
//           <div className="modal-overlay">
//             <div className="modal-content">
//               <button className="close-button" onClick={handleCloseForm}>X</button>
//               <LeaveRequest onClose={handleCloseForm} onSuccess={handleRefresh} />
//             </div>
//           </div>
//         )}

//         <div className="grid">
//           {leaveTypes.length > 0 ? (
//             leaveTypes.map((type) => (
//               <div
//                 key={type.type_id}
//                 className={`leave-card ${leaveTypeClassMap[type.type_name] || ''}`}
//               >
//                 <h2>{type.type_name}</h2>
//                 <hr />
//                 <p><strong>{getLeaveDaysUsed(type.type_id)}</strong> Days Used</p>
//               </div>
//             ))
//           ) : (
//             // Fallback static cards if leaveTypes not loaded
//             <>
//               <div className="leave-card sick-leave">
//                 <h2>Sick Leave</h2>
//                 <hr />
//                 <p><strong>2 / 10</strong> Days Used</p>
//               </div>

//               <div className="leave-card earned-leave">
//                 <h2>Earned Leave</h2>
//                 <hr />
//                 <p><strong>2 / 10</strong> Days Used</p>
//               </div>

//               <div className="leave-card casual-leave">
//                 <h2>Casual Leave</h2>
//                 <hr />
//                 <p><strong>2 / 10</strong> Days Used</p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       <div className='leave-history'>
//         <h4 className="balanceleave-text">Leave Request History</h4>

//         <div className="filters">
//           <select className="dropdown">
//             <option value="">Leave Type</option>
//             <option value="sick">Sick</option>
//             <option value="earned">Earned</option>
//             <option value="casual">Casual</option>
//           </select>

//           <select className="dropdown">
//             <option value="">Leave Status</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="cancelled">Cancelled</option>
//           </select>
//         </div>
//       </div>

//       <div className='table-leave-history'>
//         <table className="leave-table">
//           <thead>
//             <tr>
//               <th>Leave Type</th>
//               <th>Date Requested</th>
//               <th>Reason</th>
//               <th>Submitted On</th>
//               <th>Status</th>
//               <th>Assigned To</th>
//             </tr>
//           </thead>
//          <tbody>
//   {leaveRequest.length > 0 ? (
//     leaveRequest.map((request) => {
//       // Find the leave type name by matching leave_type_id
//       const leaveType = leaveTypes.find(type => type.type_id === request.type_id);
//       const leaveTypeName = leaveType ? leaveType.type_name : 'N/A';

//       return (
//         <tr key={request.id}>
//           <td>{leaveTypeName}</td>
//           <td>{formatDate(request.leave_start_date)} to {formatDate(request.leave_end_date)}</td>
//           <td>{request.reason}</td>
//           <td>{request.submitted_on || request.created_at || 'N/A'}</td>
//           <td>{request.overall_status}</td>
//           <td>{request.assigned_to || 'N/A'}</td>
//         </tr>
//       );
//     })
//   ) : (
//     <tr>
//       <td colSpan="6" style={{ textAlign: 'center' }}>
//         No leave requests found.
//       </td>
//     </tr>
//   )}
// </tbody>
//         </table>
//       </div>
//     </>
//   );
// }
// export default Home;


import './Home.css';
import { useEffect, useState } from 'react';
import LeaveRequest from './LeaveRequest';
import LeaveHistoryTable from './LeaveHistoryTable';


// For date format
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

function Home() {
  const [showForm, setShowForm] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveRequest, setLeaveRequest] = useState([]);
  const [error, setError] = useState('');

  const handleApplyLeaveClick = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const [refresh, setRefresh] = useState(0);
  const userId = localStorage.getItem('user_id');
  const handleRefresh = () => {
    setRefresh((item) => item + 1);
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const leaveTypeResponse = await fetch('http://localhost:3000/leaveType');
        const leaveTypeData = await leaveTypeResponse.json();
        if (!leaveTypeResponse.ok) throw new Error(leaveTypeData.error);
        setLeaveTypes(leaveTypeData);
      } catch (err) {
        console.error('Leave Types Error:', err);
        setError('Unable to load leave types.');
      }

      try {
        const balanceResponse = await fetch(`http://localhost:3000/leaveBalance/${userId}`);
        const balanceData = await balanceResponse.json();
        if (!balanceResponse.ok) throw new Error(balanceData.error);
        setLeaveBalance(balanceData);
      } catch (err) {
        console.error('Leave Balance Error:', err);
        setError('Unable to load leave balance.');
      }

      try {
        const requestResponse = await fetch(`http://localhost:3000/getSpecificLeaveRequest/${userId}`);
        const requestData = await requestResponse.json();
        if (!requestResponse.ok) throw new Error(requestData.error);
        setLeaveRequest(requestData);
      } catch (err) {
        console.error('Leave Request Error:', err);
        setError('Unable to load leave requests.');
      }
    };

    if (userId) fetchAllData();
  }, [userId, refresh]);

  const getLeaveDaysUsed = (typeId) => {
    const type = leaveTypes.find((lt) => lt.type_id === typeId);
    if (!type) return 'N/A';
    const total = type.total_days_allowed ?? 0;
    const balance = leaveBalance.find((lb) => lb.type_id === typeId);
    const remaining = balance ? balance.remaining_leave : total;
    const used = total - remaining;
    return `${used} / ${total}`;
  };

  const leaveTypeClassMap = {
    'Sick Leave': 'sick-leave',
    'Earned Leave': 'earned-leave',
    'Casual Leave': 'casual-leave',
  };

  return (
    <>
      <div>
        <div className='application'>
          <h4 className="balanceleave-text">Leave Balance</h4>
          <button className='applyLeave' onClick={handleApplyLeaveClick}>Apply Leave</button>
        </div>

        {error && <p className="error">{error}</p>}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-button" onClick={handleCloseForm}>X</button>
              <LeaveRequest onClose={handleCloseForm} onSuccess={handleRefresh} />
            </div>
          </div>
        )}

        <div className="grid">
          {leaveTypes.length > 0 &&
            leaveTypes.map((type) => (
              <div
                key={type.type_id}
                className={`leave-card ${leaveTypeClassMap[type.type_name] || ''}`}
              >
                <h2>{type.type_name}</h2>
                <hr />
                <p><strong>{getLeaveDaysUsed(type.type_id)}</strong> Days Used</p>
              </div>
            ))
          }
        </div>
      </div>

      <div className='leave-history'>
       
        <div className="filters">
        <h4 className="balanceleave-text">Leave Request History</h4>

          <select className="dropdown">
            <option value="">Leave Type</option>
            <option value="sick">Sick</option>
            <option value="earned">Earned</option>
            <option value="casual">Casual</option>
          </select>

          <select className="dropdown">
            <option value="">Leave Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        
        <LeaveHistoryTable leaveRequest={leaveRequest} leaveTypes={leaveTypes} />
      </div>
    </>
  );
}

export default Home;
