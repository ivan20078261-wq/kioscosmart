import React, { useEffect, useState } from 'react';
import './CSS/dashboard.css';
import Sidebar from './Components/Sidebar';
import Header from './Components/Header';
import StatCard from './Components/StatCard';
import ContentCard from './Components/ContentCard';
import ActivityList from './Components/ActivityList';
import pb from '../services/database';

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [productsCount, setProductsCount] = useState(null);
    const [products] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const readUser = async () => {
            if (!pb.authStore.isValid || !pb.authStore.model) {
                console.warn('⚠️ No hay usuario autenticado. Redirigiendo al login...');
                window.location.href = '/';
                return;
            }

            const authenticatedModel = pb.authStore.model;
            if (isMounted) setCurrentUser(authenticatedModel);

            try {
                const userData = await pb.collection('users').getOne(authenticatedModel.id, {
                    '$autoCancel': false
                });
                if (isMounted) setCurrentUser(userData);
            } catch (error) {
                if (error.status !== 0 && isMounted && authenticatedModel) {
                    console.error('Error al obtener datos actualizados:', error);
                    setCurrentUser(authenticatedModel);
                }
            }
        };

        const timer = setTimeout(() => {
            readUser();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        const fetchProductsCount = async () => {
            if (!pb.authStore.isValid) {
                setProductsCount(null);
                return;
            }

            try {
                const res = await pb.collection('productos').getList(1, 1, { fields: 'id', '$autoCancel': false });
                setProductsCount(res.totalItems);
            } catch (error) {
                console.error('Error al contar productos:', error);
                setProductsCount(null);
            }
        };

        fetchProductsCount();
    }, []);

    const stats = [
        { title: 'Ventas Hoy', value: '$12,450', change: '+12.5%', positive: true, icon: '💰' },
        { title: 'Productos', value: productsCount !== null ? productsCount : '...', change: '+8.2%', positive: true, icon: '📦' },
        { title: 'Clientes', value: '856', change: '+5.1%', positive: true, icon: '👥' },
        { title: 'Pedidos', value: '342', change: '-2.3%', positive: false, icon: '📋' },
        { title: 'Últimos 7 días', value: '—', change: '', positive: true, icon: '📅', wide: true },

    ]

    return (
        <div className="dashboard-container">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            <main className="dashboard-main">
                <Header title="Dashboard" subtitle="Bienvenido" user={currentUser} />

                <section className="stats-section">
                    {stats.map((stat, index) => (
                        <StatCard
                            key={index}
                            title={stat.title}
                            value={stat.value}
                            change={stat.change}
                            positive={stat.positive}
                            icon={stat.icon}
                            wide={stat.wide}
                        />
                    ))}
                </section>

                <section className="content-section">
                    <ContentCard 
                        title="· Crítico" 
                        actionText="Ver más →"
                        actionOnClick={() => console.log('Ver más crítico')}
                    >
                        <p className="card-description">
                            Aquí puedes agregar contenido crítico o importante de tu aplicación.
                        </p>
                    </ContentCard>

                    <ContentCard title="Actividad Reciente">
                        <ActivityList />
                    </ContentCard>

                   
                </section>
            </main>
        </div>
    );
}
