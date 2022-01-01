import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Latency from './Latency'
import Tomasulo from './Tomasulo'
import {BrowserRouter} from 'react-router-dom';

ReactDOM.render(<BrowserRouter>
<App />
</BrowserRouter>,
  document.getElementById('root')
);
