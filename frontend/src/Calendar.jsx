// export default Calendar;
import { useEffect, useState } from "react";
import moment from "moment";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import './Calendar.css';

const localizer = momentLocalizer(moment);  //it will handle date in calendar 
const currentDate= new Date()

function Calendar() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [date, setDate] = useState(new Date());  // <-- Add date state

    // Load user from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Fetch leave data when user is available
    useEffect(() => {
        if (!user) return;

        const { role, id } = user;

        if (!["MANAGER", "HR", "DIRECTOR"].includes(role)) {
            setError("You are not authorized to view this calendar.");
            return;
        }

        const fetchLeaves = async () => {
            try {
                const response = await fetch(`http://localhost:3000/getApprovedRequest/${id}`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Failed to fetch leave data");

                const approvedLeaves = data.filter(req => req.overall_status === "APPROVED" 
                    
                );
                setLeaveRequests(approvedLeaves);

            } catch (err) {
                console.error("Leave Request Error:", err);
                setError("Failed to load leave calendar.");
            }
        };

        fetchLeaves();
    }, [user]);

    // Convert leaveRequests to calendar events
    const events = leaveRequests.map(req => {
        const start = new Date(req.leave_start_date);
        const end = new Date(req.leave_end_date);
        const leaveDays = moment(end).diff(moment(start), "days") + 1;

        return {
            title: `${req.employee_name} - Out of Office (${leaveDays} day${leaveDays > 1 ? 's' : ''})`,
            start: start,
            end: moment(end).add(1, "day").toDate(), // include last day
            allDay: true
        };
    });

    // Handler for month navigation
    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    return (
        <div className="calendar-container" style={{ height: "80vh", margin: "20px" }}>
            <h2>Calendar</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                views={['month']} // only allow 'month' view
                toolbar={true}
                date={date}             // <-- control visible date here
                onNavigate={handleNavigate}  // <-- handle navigation here
               
            />
        </div>
    );
}

export default Calendar;
