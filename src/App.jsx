import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Invoices from './pages/Invoices.jsx';
import Bills from './pages/Bills.jsx';
import Forecast from './pages/Forecast.jsx';
import { loadData, saveData } from './data/store.js';

const PAGES = {
  dashboard: Dashboard,
  students: Students,
  invoices: Invoices,
  bills: Bills,
  forecast: Forecast,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('students');
  const [data, setData] = useState(() => loadData());
  useEffect(() => {
    saveData(data);
  }, [data]);
  const Page = PAGES[currentPage];

  return (
    <div className="app">
      <Header />
      <NavBar current={currentPage} onChange={setCurrentPage} />
      <Page data={data} setData={setData} onNavigate={setCurrentPage} />
    </div>
  );
}
