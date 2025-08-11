import { useNavigate } from 'react-router-dom';
import AllCoursesView from './AllCoursesView';

export default function CoursesPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  return <AllCoursesView onBack={handleBack} />;
}
