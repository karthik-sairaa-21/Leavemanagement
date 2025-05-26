import './LeaveRequest.css';
import { useState } from 'react';


function LeaveRequest() {
  const [formData, setFormData] = useState({
    empId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:3000/userLeaveRequest/${formData.empId}`, {
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
      if (response.ok) {
        alert('Leave request submitted successfully!');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong.');
    }
  };

  return (
    <form className="leave-form" onSubmit={handleSubmit}>
      <label htmlFor="empId">Enter Employee ID</label>
      <input type="text" id="empId" value={formData.empId} onChange={handleChange} required />

      <label htmlFor="leaveType">Leave Type ID</label>
      <input type="text" id="leaveType" value={formData.leaveType} onChange={handleChange} required />

      <label htmlFor="startDate">Start Date</label>
      <input type="date" id="startDate" value={formData.startDate} onChange={handleChange} required />

      <label htmlFor="endDate">End Date</label>
      <input type="date" id="endDate" value={formData.endDate} onChange={handleChange} required />

      <label htmlFor="reason">Reason</label>
      <textarea id="reason" value={formData.reason} onChange={handleChange} required></textarea>

      <button type="submit" >Apply Leave</button>
    </form>
  );
}

export default LeaveRequest;
