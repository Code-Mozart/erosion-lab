import { useState, useRef } from 'react';
import * as THREE from 'three';
import './App.css';

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Hello world</p>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
    </div>
  );
}