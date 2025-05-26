import './Navbar.css';
import Home from './Home';
function Navbar() {
  return (
    <div className="navbar-container">
      <aside className="sidebar">
        <div className="profile">
          <h4 className="name">Hi Karthikeyan</h4>
          <p className="role">Product Developer</p>
        </div>
      </aside>
      <div className="main-content">
        <header className="header">
          <h4 className="heading">Leave Request Management</h4>
        </header>
        <Home/>
      </div>
     
    </div>
    
  );
}

export default Navbar;
