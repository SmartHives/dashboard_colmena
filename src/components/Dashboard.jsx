import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ThermometerSun, Droplets, Sprout, Wind } from 'lucide-react';
import { ref, onValue, query, orderByChild, limitToLast } from "firebase/database";
import { db } from '../config/firebase';

const Dashboard = () => {
  const [currentData, setCurrentData] = useState({
    temperature: 0,
    humidity: 0,
    timestamp: new Date().toISOString()
  });
  const [historicData, setHistoricData] = useState([]);
  const [status, setStatus] = useState('normal');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Suscripción a datos actuales
    const currentRef = ref(db, 'colmenas/actual');
    const unsubscribeCurrent = onValue(currentRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = {
          temperature: Number(data.temperature || 0),
          humidity: Number(data.humidity || 0),
          timestamp: data.timestamp || new Date().toISOString()
        };
        setCurrentData(formattedData);
        checkStatus(formattedData);
      }
    }, (error) => {
      console.error('Error leyendo datos actuales:', error);
    });

    // Suscripción a datos históricos
    const historicRef = query(
      ref(db, 'colmenas/historico'),
      orderByChild('timestamp'),
      limitToLast(50)
    );

    const unsubscribeHistoric = onValue(historicRef, (snapshot) => {
      setIsLoading(false);
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        
        const data = Object.entries(rawData)
          .map(([key, value]) => ({
            temperature: Number(value.temperature || 0),
            humidity: Number(value.humidity || 0),
            timestamp: value.timestamp ? new Date(value.timestamp).toLocaleTimeString() : '',
            soil_moisture: Number(value.soil_moisture || 0),
            co2_level: Boolean(value.co2_level)
          }))
          .filter(item => item.timestamp && !isNaN(item.temperature) && !isNaN(item.humidity))
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setHistoricData(data);
      } else {
        setHistoricData([]);
      }
    }, (error) => {
      console.error('Error leyendo datos históricos:', error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeCurrent();
      unsubscribeHistoric();
    };
  }, []);

  const checkStatus = (data) => {
    const limits = {
      temperature: { min: 20, max: 35 },
      humidity: { min: 30, max: 80 }
    };

    let newStatus = 'normal';
    
    Object.entries(limits).forEach(([key, range]) => {
      const value = data[key];
      if (value < range.min || value > range.max) {
        newStatus = 'error';
      } else if (value < range.min + 2 || value > range.max - 2) {
        newStatus = 'warning';
      }
    });

    setStatus(newStatus);
  };

  const getStatusColor = (value, type) => {
    const ranges = {
      temperature: { min: 20, max: 35 },
      humidity: { min: 30, max: 80 }
    };
    
    const range = ranges[type];
    if (!range) return 'text-gray-500';
    
    if (value < range.min) return 'text-blue-500';
    if (value > range.max) return 'text-red-500';
    return 'text-green-500';
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Monitoreo Colmena</h1>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date(currentData.timestamp).toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
            <ThermometerSun className={getStatusColor(currentData.temperature, 'temperature')} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData.temperature.toFixed(1)}°C
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humedad</CardTitle>
            <Droplets className={getStatusColor(currentData.humidity, 'humidity')} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData.humidity.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humedad de la Miel</CardTitle>
            <Sprout className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              No conectado
            </div>
            <div className="text-xs text-gray-500">
              Sensor desconectado
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel CO2</CardTitle>
            <Wind className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              No conectado
            </div>
            <div className="text-xs text-gray-500">
              Sensor desconectado
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full h-96">
        <CardHeader>
          <CardTitle>Histórico de Mediciones</CardTitle>
          <div className="text-sm text-gray-500">
            Últimos {historicData.length} registros
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              Cargando datos...
            </div>
          ) : historicData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No hay datos históricos disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historicData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  yAxisId="temp"
                  domain={[0, 40]}
                  orientation="left"
                  label={{ 
                    value: 'Temperatura (°C)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <YAxis 
                  yAxisId="hum"
                  orientation="right"
                  domain={[0, 100]}
                  label={{ 
                    value: 'Humedad (%)', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  formatter={(value, name) => {
                    if (name === "Temperatura") return `${value.toFixed(1)}°C`;
                    if (name === "Humedad") return `${value.toFixed(1)}%`;
                    return value;
                  }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ff7300"
                  name="Temperatura"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="hum"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#387908"
                  name="Humedad"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {status !== 'normal' && (
        <Alert variant={status === 'warning' ? 'warning' : 'destructive'}>
          <AlertDescription>
            {status === 'warning' 
              ? 'Algunos valores están cerca de los límites recomendados' 
              : 'Se detectaron valores fuera de rango'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Dashboard;