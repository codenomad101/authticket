// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

function Authentication({ handleRegister, handleLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthentication = async () => {
    // Assume handleLogin sets the token in some way
    const token = await handleLogin();
    if (token) {
      console.log('Login successful');
    }
  };

  return (
    <div>
      <h2>Authentication</h2>
      <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleAuthentication}>Login</button>
    </div>
  );
}
function TicketForm({ handleCreateTicket }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCreateTicket({ title, description });
    setTitle('');
    setDescription('');
  };

  return (
    <div>
      <h2>Create Ticket</h2>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        <button type="submit">Create Ticket</button>
      </form>
    </div>
  );
}
function Tickets({ handleCreateTicket, tickets }) {
  return (
    <div>
      <h2>Tickets</h2>
      <button onClick={handleCreateTicket}>Create Ticket</button>
      <ul>
        {tickets.map((ticket) => (
          <li key={ticket._id}>{ticket.title} - {ticket.description}</li>
        ))}
      </ul>
    </div>
  );
}

function Users({ handleGetUsers, users }) {
  return (
    <div>
      <h2>Users</h2>
      <button onClick={handleGetUsers}>Get Users</button>
      <ul>
        {users.map((user) => (
          <li key={user._id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        console.log('User registered successfully');
      } else {
        const data = await response.json();
        console.error('Registration error:', data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        console.log(data.token);
        setIsAuth(true);
        console.log('Login successful');
      } else {
        const data = await response.json();
        console.error('Login error:', data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await fetch('http://localhost:5000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        const newTicket = await response.json();
        setTickets((prevTickets) => [...prevTickets, newTicket]);
        console.log('Ticket created successfully');
      } else {
        const data = await response.json();
        console.error('Create ticket error:', data.error);
      }
    } catch (error) {
      console.error('Create ticket error:', error);
    }
  };

  const handleGetUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const data = await response.json();
        console.error('Get users error:', data.error);
      }
    } catch (error) {
      console.error('Get users error:', error);
    }
  };

  useEffect(() => {
    // Fetch user tickets on component mount
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:5000/tickets', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
    
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        } else {
          // Check if the response is JSON
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            // Handle JSON error response
            const errorData = await response.json();
            console.error('Fetch tickets error:', response.status, errorData);
          } else {
            // Handle non-JSON error response
            const text = await response.text();
            console.log('Non-JSON response:', text);
            console.error('Fetch tickets error:', response.status);
          }
        }
      } catch (error) {
        console.error('Fetch tickets error:', error);
      }
    };

    if (isAuth) {
      fetchTickets();
    }
  }, [isAuth, token]); // Fetch tickets when the token changes

  return (
    <Router>
      <div>
        <h1>React Frontend</h1>
        <Routes>
          <Route
            path="/tickets"
            element={isAuth ? (
              <>
                <Tickets handleCreateTicket={handleCreateTicket} tickets={tickets} />
                <TicketForm handleCreateTicket={handleCreateTicket} />
              </>
            ) : (
              <Navigate to="/" />
            )}
          />
          <Route
            path="/users"
            element={isAuth ? <Users handleGetUsers={handleGetUsers} users={users} /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={
              isAuth ? (
                <Navigate to="/tickets" />
              ) : (
                <Authentication handleRegister={handleRegister} handleLogin={handleLogin} isAuth={isAuth}/>
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
