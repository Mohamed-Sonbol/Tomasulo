import React from 'react'
import { Route, Routes } from 'react-router-dom';
import Latency from './Latency';
import Tomasulo from './Tomasulo';

export default function App() {
    return (
      <div>
          <Routes>
            <Route path="/" element={<Latency/>} />
            <Route path="/Tomasulo" element={<Tomasulo/>} />
          </Routes>
      </div>
    )
  }