// import { FaSignOutAlt, FaCalendarAlt } from 'react-icons/fa';


// <FaCalendarAlt />
// import { useNavigate } from 'react-router-dom';
// import './Navbar.css';
// import Home from './Home';


// import { useEffect, useState } from 'react';
// import PendingRequest from './PendingRequest';


// function Navbar() {
//   const [username, setUser] = useState({});
//   const [showPending, setShowPending] = useState(false);
//   const [userId, setUserId] = useState(null);

//   const navigate = useNavigate();

//   useEffect(() => {
//     const id = localStorage.getItem('user_id');
//     setUserId(id);
//   }, []);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const response = await fetch(`http://localhost:3000/users/${userId}`);
//         const data = await response.json();

//         if (!response.ok) {
//           throw new Error(data.error || 'Failed to fetch user');
//         }

//         setUser(data);
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     if (userId) {
//       fetchUser();
//     }
//   }, [userId]);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     localStorage.removeItem('user_id');
//     setUser({});
//     setShowPending(false);
//     navigate('/', { replace: true }); // Go to login page
//   };

//   const sidebarRole = username.role;


//   const handlerCalenderClick=()=>{
//     navigate('/calendar')
//   }

//   return (
//     <div className="navbar-container">
//       <aside className="sidebar">
//         <div className="profile">
//           <h4 className="name">Hi {username.name || 'User'}</h4>
//           <p className="role">{username.role || 'N/A'}</p>
//         </div>

//         {(sidebarRole?.toUpperCase() === 'MANAGER' ||
//           sidebarRole?.toUpperCase() === 'DIRECTOR' ||
//           sidebarRole?.toUpperCase() === 'HR') && (
//             <>
//               <div className="PendingLeaveRequest">
//                 <h3 onClick={() => setShowPending(!showPending)}>Pending Request</h3>
//               </div>

//               <div className="Calender" >
//                 <h3 className="calender-button" onClick={handlerCalenderClick}>
//                   <FaCalendarAlt />
//                   Calender
//                 </h3>
//               </div>

//             </>


//           )}

//         <div className="logout-container" onClick={handleLogout}>
//           <h3 className="logout-button">
//             <FaSignOutAlt className="logout-icon" />
//             Log Out
//           </h3>
//         </div>

//       </aside>

//       <div className="main-content">
//         <header className="header">
//           <h4 className="heading">Leave Management</h4>
//         </header>

//         {showPending ? <PendingRequest /> : <Home />}
//       </div>
//     </div>
//   );
// }

// export default Navbar;




import { FaSignOutAlt, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import './Navbar.css';
import Home from './Home';
import PendingRequest from './PendingRequest';
import Calendar from './Calendar'; // ✅ Add this import

function Navbar() {
  const [username, setUser] = useState({});
  const [activeComponent, setActiveComponent] = useState("HOME");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    setUserId(id);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${userId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user');
        }
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    setUser({});
    navigate('/', { replace: true });
  };

  const sidebarRole = username.role;

  return (
    <div className="navbar-container">
      <aside className="sidebar">
        <div className="profile">
          <h4 className="name">Hi {username.name || 'User'}</h4>
          <p className="role">{username.role || 'N/A'}</p>
        </div>

        {(sidebarRole?.toUpperCase() === "MANAGER" ||
          sidebarRole?.toUpperCase() === "DIRECTOR" ||
          sidebarRole?.toUpperCase() === "HR") && (
          <>
            <div className="PendingLeaveRequest">
              <h3 onClick={() => setActiveComponent("PENDING")}>
                Pending Request
              </h3>
            </div>

            <div className="Calender">
              <h3
                className="calender-button"
                onClick={() => setActiveComponent("CALENDAR")}
              >
                <FaCalendarAlt />
                Calendar
              </h3>
            </div>
          </>
        )}

        <div className="logout-container" onClick={handleLogout}>
          <h3 className="logout-button">
            <FaSignOutAlt className="logout-icon" />
            Log Out
          </h3>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <h4 className="heading">Leave Management</h4>
        </header>

        {/* ✅ Show content based on activeComponent */}
        {activeComponent === "HOME" && <Home />}
        {activeComponent === "PENDING" && <PendingRequest />}
        {activeComponent === "CALENDAR" && <Calendar />}
      </div>
    </div>
  );
}

export default Navbar;
