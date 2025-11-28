import QuestionCreateForm from '../../components/QuestionCreateForm';

function CreateQuestionWithExam() {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://api.deutsch-tests.com';
  const token = localStorage.getItem('accessToken') || '';

  return <QuestionCreateForm apiBaseUrl={apiBaseUrl} token={token} />;
}

export default CreateQuestionWithExam;

