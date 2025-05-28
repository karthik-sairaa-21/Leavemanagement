import './LeaveRequest.css';
import { useState, useEffect } from 'react';

function LeaveRequest(props) {
  console.log(props);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [leaveTypes, setLeaveTypes] = useState([]);

  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    // Fetch leave types from API
    const fetchLeaveTypes = async () => {
      try {
        const response = await fetch('http://localhost:3000/leaveType');
        const data = await response.json();
        if (response.ok) {
          setLeaveTypes(data);
        } else {
          console.error('Failed to fetch leave types:', data.error);
        }
      } catch (err) {
        console.error('Error fetching leave types:', err);
      }
    };

    fetchLeaveTypes();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
  
    // ✅ Condition 1: Start date must be before or same as end date
    if (start > end) {
      alert("Start date must be before or equal to end date.");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3000/userLeaveRequest/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type_id: formData.leaveType,
          leave_start_date: formData.startDate,
          leave_end_date: formData.endDate,
          reason: formData.reason
        })
      });
  
      const data = await response.json();
  
      // ✅ Backend condition: Check for duplicate leave error
      if (!response.ok) {
        if (data.error === "You cannot use the leave date because it is duplicate") {
          alert("You've already applied for leave for these dates.");
        } else {
          alert('Failed: ' + data.error);
        }
        
        return;
      }
  
      alert('Leave request submitted successfully!');
      if (props.onSuccess) props.onSuccess();
  
      // Optionally reset form
      setFormData({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: ''
      });
  
    } catch (err) {
      console.error(err);
      alert('Something went wrong.');
    }
  };
  

  return (
    <form className="leave-form" onSubmit={handleSubmit}>
      <label htmlFor="leaveType">Leave Type</label>
      <select id="leaveType" value={formData.leaveType} onChange={handleChange} required>
        <option value="">-- Select Leave Type --</option>
        {leaveTypes.map((type) => (
          <option key={type.type_id} value={type.type_id}>
            {type.type_name}
          </option>
        ))}
      </select>

      <label htmlFor="startDate">Start Date</label>
      <input type="date" id="startDate" value={formData.startDate} onChange={handleChange} required />

      <label htmlFor="endDate">End Date</label>
      <input type="date" id="endDate" value={formData.endDate} onChange={handleChange} required />

      <label htmlFor="reason">Reason</label>
      <textarea id="reason" value={formData.reason} onChange={handleChange} required></textarea>

      <button type="submit">Apply Leave</button>
    </form>
  );
}

export default LeaveRequest;
