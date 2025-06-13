import './Home.css';
import { useEffect, useState } from 'react';
import LeaveRequest from './LeaveRequest';
import LeaveHistoryTable from './LeaveHistoryTable';



// For date format
// const formatDate = (dateStr) => {
//   if (!dateStr) return 'N/A';
//   const date = new Date(dateStr);
//   return date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//   });
// };

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
       const token = localStorage.getItem("token");
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

        const balanceResponse = await fetch(`http://localhost:3000/leaveBalance/${userId}`,{
          headers:{
            Authorization:`Bearer ${token}`,
          },
        
        }
      );
        const balanceData = await balanceResponse.json();
        if (!balanceResponse.ok) throw new Error(balanceData.error);
        setLeaveBalance(balanceData);
      } catch (err) {
        console.error('Leave Balance Error:', err);
        setError('Unable to load leave balance.');
      }

      try {
        const requestResponse = await fetch(`http://localhost:3000/getSpecificLeaveRequest/${userId}`,{
          headers:{
            Authorization:`Bearer ${token}`,
          }
        });
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
