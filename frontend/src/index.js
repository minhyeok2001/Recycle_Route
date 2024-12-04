import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Map from './Map';
import Sidebar from './Sidebar';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Map />
    <Sidebar/>
  </React.StrictMode>
);