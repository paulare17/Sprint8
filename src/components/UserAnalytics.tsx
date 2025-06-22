import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useShoppingList } from '../contexts/ShoppingListContext';
import type { ToDoItem, ShoppingList } from './types';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface UserStats {
  addedItems: { [email: string]: number };
  purchasedItems: { [email: string]: number };
  userNames: { [email: string]: string };
}

const UserAnalytics: React.FC = () => {
  const { currentList, userLists } = useShoppingList();

  // Procesar datos de todos los usuarios en la lista actual
  const userStats = useMemo((): UserStats => {
    if (!currentList) {
      return { addedItems: {}, purchasedItems: {}, userNames: {} };
    }

    const stats: UserStats = {
      addedItems: {},
      purchasedItems: {},
      userNames: {}
    };

    // Inicializar contadores para todos los miembros
    currentList.members.forEach(email => {
      stats.addedItems[email] = 0;
      stats.purchasedItems[email] = 0;
      // Crear nombre de usuario a partir del email
      stats.userNames[email] = email.split('@')[0];
    });

    // Contar productos añadidos por cada usuario
    currentList.items.forEach((item: ToDoItem) => {
      if (item.addedBy && stats.addedItems.hasOwnProperty(item.addedBy)) {
        stats.addedItems[item.addedBy]++;
        
        // Si el item está marcado como comprado, también contar como comprado
        if (item.done) {
          stats.purchasedItems[item.addedBy]++;
        }
      }
    });

    return stats;
  }, [currentList]);

  // Datos para el gráfico de productos añadidos
  const addedItemsChartData = useMemo(() => {
    const emails = Object.keys(userStats.addedItems);
    const userNames = emails.map(email => userStats.userNames[email]);
    const values = emails.map(email => userStats.addedItems[email]);

    return {
      labels: userNames,
      datasets: [
        {
          label: 'Productes afegits',
          data: values,
          backgroundColor: [
            'rgba(163, 239, 113, 0.8)', // Verde primary
            'rgba(235, 113, 240, 0.8)', // Rosa secondary
            'rgba(54, 162, 235, 0.8)',  // Azul
            'rgba(255, 206, 86, 0.8)',  // Amarillo
            'rgba(75, 192, 192, 0.8)',  // Verde agua
            'rgba(153, 102, 255, 0.8)', // Morado
          ],
          borderColor: [
            'rgba(163, 239, 113, 1)',
            'rgba(235, 113, 240, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [userStats]);

  // Datos para el gráfico de productos comprados
  const purchasedItemsChartData = useMemo(() => {
    const emails = Object.keys(userStats.purchasedItems);
    const userNames = emails.map(email => userStats.userNames[email]);
    const values = emails.map(email => userStats.purchasedItems[email]);

    return {
      labels: userNames,
      datasets: [
        {
          label: 'Productes comprats',
          data: values,
          backgroundColor: [
            'rgba(163, 239, 113, 0.8)',
            'rgba(235, 113, 240, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderColor: [
            'rgba(163, 239, 113, 1)',
            'rgba(235, 113, 240, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [userStats]);

  // Opciones para los gráficos
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Activitat dels Usuaris',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribució de Compres',
      },
    },
  };

  if (!currentList) {
    return (
      <div className="analytics-container">
        <h3>📊 Analítica d'Usuaris</h3>
        <p>Selecciona una llista per veure les estadístiques dels usuaris.</p>
      </div>
    );
  }

  const totalAdded = Object.values(userStats.addedItems).reduce((sum, count) => sum + count, 0);
  const totalPurchased = Object.values(userStats.purchasedItems).reduce((sum, count) => sum + count, 0);

  return (
    <div className="analytics-container">
      <h3>📊 Analítica d'Usuaris - {currentList.name}</h3>
      
      {/* Estadísticas generales */}
      <div className="analytics-summary">
        <div className="stat-card">
          <h4>📝 Total Productes Afegits</h4>
          <span className="stat-number">{totalAdded}</span>
        </div>
        <div className="stat-card">
          <h4>✅ Total Productes Comprats</h4>
          <span className="stat-number">{totalPurchased}</span>
        </div>
        <div className="stat-card">
          <h4>👥 Membres Actius</h4>
          <span className="stat-number">{currentList.members.length}</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-container">
        <div className="chart-section">
          <h4>📈 Productes Afegits per Usuari</h4>
          <div className="chart-wrapper">
            <Bar data={addedItemsChartData} options={barOptions} />
          </div>
        </div>

        <div className="chart-section">
          <h4>🛒 Distribució de Compres</h4>
          <div className="chart-wrapper">
            <Doughnut data={purchasedItemsChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics; 