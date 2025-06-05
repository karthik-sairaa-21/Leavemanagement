// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import LoginForm from './LoginForm';
import Calendar from './Calendar';
import UploadBulkUsers from './UploadBulkUsers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/navbar" element={<Navbar />} />
         <Route path="/uploadBulkUsers" element={<UploadBulkUsers/>} />
        <Route path="/calendar" element={<Calendar/>} />
      </Routes>
    </Router>
  );
}

export default App; // ✅ This line is required!
