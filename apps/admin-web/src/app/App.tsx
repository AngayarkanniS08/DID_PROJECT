import { Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import SetupWizardPage from '../pages/onboarding/SetupWizardPage';
import { Dashboard } from '../pages/dashboard/DashboardHome';
import { StudentSharePage } from '../pages/student/StudentShare';
import { VerifierPortal } from '../pages/verifier/VerifierPortal';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/setup" element={<SetupWizardPage />} />
      <Route path="/share/:id" element={<StudentSharePage />} />
      <Route path="/verify" element={<VerifierPortal />} />
    </Routes>
  );
}

export default App;
