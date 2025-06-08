import { useAuth } from '../context/AuthContext';

function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div>
        <h1>Please log in to access the home page.</h1>
      </div>
    );
  } else {
    return (
      <div>
          <h1>Home Page</h1>
      </div>
    )
  }
}

export default HomePage;
