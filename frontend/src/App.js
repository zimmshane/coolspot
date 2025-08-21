import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 'useState' is a Hook to create a piece of state.
  // 'tasks' will hold our array of data, and 'setTasks' is the function to update it.
  const [tasks, setTasks] = useState([]);

  // 'useEffect' is a Hook for running "side effects."
  // Fetching data is a side effect. This runs once when the component loads.
  useEffect(() => {
    // We fetch from our own backend server's URL!
    fetch('http://localhost:3001/')
      .then(response => response.json())
      .then(data => {
        console.log('Tasks fetched from API:', data);
        setTasks(data); // Update our state with the data from the API
      });
  }, []); // The empty array [] means this effect runs only once.

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Task List</h1>
        <ul className="task-list">
          {/* We use .map() to loop over the tasks array and create an <li> for each one */}
          {tasks.map(task => (
            <li key={task.id}>
              {task.text}
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;