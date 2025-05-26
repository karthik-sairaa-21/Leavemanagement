// import './Home.css';
// import { useState } from 'react';
// import LeaveRequest from './LeaveRequest';
// function Home() {
//     const [showForm, setShowForm] = useState(false);
//     const handleApplyLeaveClick = () => {
//         setShowForm(true);
//     };

//     const handleCloseForm = () => {
//         setShowForm(false);
//     };

//     const user=localStorage.getItem('user_id', data.user.id);

//     return (
//         <>
//             <div>
//                 <div className='application'>
//                     <h4 className="balanceleave-text">Leave Balance</h4>
//                     <button className='applyLeave' onClick={handleApplyLeaveClick}>Apply Leave</button>

//                 </div>
//                 {showForm && (
//                     <div className="modal-overlay">
//                         <div className="modal-content">
//                             <button className="close-button" onClick={handleCloseForm}>X</button>
//                             <LeaveRequest/>
//                         </div>
//                     </div>
//                 )}




//                 <div className="grid">
//                     <div className="leave-card sick-leave">
//                         <h2>Sick Leave</h2>
//                         <hr />
//                         <p><strong>2 / 10</strong> Days Used</p>
//                     </div>

//                     <div className="leave-card earned-leave">
//                         <h2>Earned Leave</h2>
//                         <hr />
//                         <p><strong>2 / 10</strong> Days Used</p>
//                     </div>

//                     <div className="leave-card casual-leave">
//                         <h2>Casual Leave</h2>
//                         <hr />
//                         <p><strong>2 / 10</strong> Days Used</p>
//                     </div>
//                 </div>

//             </div>



//             <div className='leave-history'>
//                 <h4 className="balanceleave-text">Leave Request History</h4>

//                 <div className="filters">
//                     <select className="dropdown">
//                         <option value="">Leave Type</option>
//                         <option value="sick">Sick</option>
//                         <option value="earned">Earned</option>
//                         <option value="casual">Casual</option>
//                     </select>

//                     <select className="dropdown">
//                         <option value="">Leave Status</option>
//                         <option value="pending">Pending</option>
//                         <option value="approved">Approved</option>
//                         <option value="cancelled">Cancelled</option>
//                     </select>
//                 </div>
//             </div>


//             <div className='table-leave-history'>
//                 <table class="leave-table">
//                     <thead>
//                         <tr>
//                             <th>Leave Type</th>
//                             <th>Date Requested</th>
//                             <th>Reason</th>
//                             <th>Submitted On</th>
//                             <th>Status</th>
//                             <th>Assigned To</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         <tr>
//                             <td>Sick</td>
//                             <td>2025-05-20 to 2025-05-22</td>
//                             <td>Fever</td>
//                             <td>2025-05-19</td>
//                             <td>Pending</td>
//                             <td>Manager</td>
//                         </tr>

//                     </tbody>
//                 </table>


//             </div>

//         </>

//     );
// }

// export default Home;
import './Home.css';
import { useEffect, useState } from 'react';
import LeaveRequest from './LeaveRequest';

function Home() {
  const [showForm, setShowForm] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [error, setError] = useState('');

  const handleApplyLeaveClick = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const userId = localStorage.getItem('user_id');

  // Fetch leave types (master data)
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await fetch('http://localhost:3000/leaveType');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch leave types');
        }

        setLeaveTypes(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load leave types.');
      }
    };

    fetchLeaveTypes();
  }, []);

  // Fetch leave balance for user
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await fetch(`http://localhost:3000/leaveBalance/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch leave balance');
        }

        setLeaveBalance(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load leave balance.');
      }
    };

    if (userId) {
      fetchLeaveBalance(); // 
    }
  }, [userId]);

  // ✅ THIS FUNCTION DOES THE JOINING OF leaveTypes AND leaveBalance
  const getLeaveDaysUsed = (typeId) => {
    const type = leaveTypes.find((lt) => lt.type_id === typeId);
    if (!type) return 'N/A';

    const total = type.total_days_allowed ?? 0;

    const balance = leaveBalance.find((lb) => lb.type_id === typeId);
    const remaining = balance ? balance.remaining_leave : total;
    const used = total - remaining;

    return `${used} / ${total}`;
  };

  return (
    <div className="home-container">
      <h2>Leave Dashboard</h2>
      {error && <p className="error">{error}</p>}

      <div className="leave-balance-list">
        {leaveTypes.map((type) => (
          <div className="leave-type-card" key={type.type_id}>
            <h3>{type.type_name}</h3>
            <p>Used / Total: {getLeaveDaysUsed(type.type_id)}</p>
          </div>
        ))}
      </div>

      <button className="apply-button" onClick={handleApplyLeaveClick}>
        Apply Leave
      </button>

      {showForm && <LeaveRequest onClose={handleCloseForm} />}
    </div>
  );
}

export default Home;
