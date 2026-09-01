import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireRole } from './components/RequireRole';
import { RequireAuth } from './components/RequireAuth';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Subscription from './pages/Subscription';
import GradeSelect from './pages/GradeSelect';
import SemesterSelect from './pages/SemesterSelect';
import SubjectSelect from './pages/SubjectSelect';
import ModuleList from './pages/ModuleList';
import ModulePage from './pages/ModulePage';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherReport from './pages/TeacherReport';
import SessionManager from './pages/SessionManager';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import SubjectManager from './pages/teacher/SubjectManager';
import ModuleManager from './pages/teacher/ModuleManager';
import ModuleEditor from './pages/teacher/ModuleEditor';
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildDashboard from './pages/child/ChildDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/harga" element={<Pricing />} />
          <Route path="/masuk" element={<Login />} />
          <Route path="/daftar" element={<Register />} />

          {/* The whole learning flow (kelas -> semester -> mapel -> modul)
              requires being logged in as either a teacher or a student. */}
          <Route
            path="/kelas"
            element={
              <RequireAuth>
                <GradeSelect />
              </RequireAuth>
            }
          />
          <Route
            path="/kelas/:grade"
            element={
              <RequireAuth>
                <SemesterSelect />
              </RequireAuth>
            }
          />
          <Route
            path="/kelas/:grade/semester/:semester"
            element={
              <RequireAuth>
                <SubjectSelect />
              </RequireAuth>
            }
          />
          <Route
            path="/kelas/:grade/semester/:semester/mapel/:subjectId"
            element={
              <RequireAuth>
                <ModuleList />
              </RequireAuth>
            }
          />
          <Route
            path="/modul/:moduleId"
            element={
              <RequireAuth>
                <ModulePage />
              </RequireAuth>
            }
          />

          <Route path="/guru/laporan" element={<TeacherReport />} />
          <Route path="/akun/sesi" element={<SessionManager />} />
          <Route
            path="/akun/langganan"
            element={
              <RequireAuth>
                <Subscription />
              </RequireAuth>
            }
          />
          <Route
            path="/guru"
            element={
              <RequireRole role="TEACHER">
                <TeacherDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/guru/mapel"
            element={
              <RequireRole role="TEACHER">
                <SubjectManager />
              </RequireRole>
            }
          />
          <Route
            path="/guru/modul"
            element={
              <RequireRole role="TEACHER">
                <ModuleManager />
              </RequireRole>
            }
          />
          <Route
            path="/guru/modul/:moduleId"
            element={
              <RequireRole role="TEACHER">
                <ModuleEditor />
              </RequireRole>
            }
          />

          {/* Parent routes */}
          <Route
            path="/orangtua"
            element={
              <RequireRole role="PARENT">
                <ParentDashboard />
              </RequireRole>
            }
          />

          {/* Child dashboard */}
          <Route
            path="/anak"
            element={
              <RequireAuth>
                <ChildDashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
