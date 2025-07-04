import { useNavigate } from 'react-router-dom';
import Container from '../components/todolist/Container';
import { useAuth } from '../hooks/useAuth';
import FAQs from '../components/FAQs';

function HomePage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <>
    {/* {pg inici si no hi ha user} */}
      {!currentUser ? (
        <>
          <section className='inicia-section'>
            <button 
              className='inicia-button' 
              onClick={() => navigate('/register')}
            >
              Comença aquí - Registra't
            </button>
          </section>

          <div className="welcome-message">
            <h2>Benvingut/da a Inprocode Shopping</h2>
            <p>La teva aplicació per gestionar llistes de compra compartides</p>
            <p>Registra't per començar a crear i compartir les teves llistes!</p>
          </div>
        </>
      ) : (
        <>
          {/* Mostrar llista de ToDo si està connectat */}
          <div className="user-info">
            <h2>Benvingut/da, {userProfile?.displayName}!</h2>
          </div>
          <Container />
        </>
      )}
      <FAQs/>
    </>
  );
}

export default HomePage;

