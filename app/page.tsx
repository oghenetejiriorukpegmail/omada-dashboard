import UserCreationForm from './components/UserCreationForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-[#1a1f2e] p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto py-8">
        <UserCreationForm />
      </div>
    </div>
  );
}
