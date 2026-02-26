import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import SetupWizardPage from '../pages/onboarding/SetupWizardPage';
import { Dashboard } from '../pages/dashboard/DashboardHome';
import { StudentSharePage } from '../pages/student/StudentShare';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/setup" element={<SetupWizardPage />} />
      <Route path="/share/:id" element={<StudentSharePage />} />
    </Routes>
  );
}

export default App;
