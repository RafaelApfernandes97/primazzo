# Sistema de Autenticação - WhatsApp Viewer

## ✅ Instalado
- jsonwebtoken
- bcrypt
- JWT_SECRET adicionado ao .env

## 🔧 Modificações Necessárias

### 1. BACKEND - server.js

#### Adicionar após o middleware authenticateToken (linha 31):

```javascript
// Rota de login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Credenciais fixas
  const VALID_USERNAME = 'primazzo';
  const VALID_PASSWORD = 'primazzo2026';

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
});
```

#### Proteger rotas (modificar linhas 61, 158, 228, 330):

```javascript
// Antes: app.get('/api/contatos', async (req, res) => {
// Depois:
app.get('/api/contatos', authenticateToken, async (req, res) => {

// Antes: app.get('/api/contatos/:canalCliente/atendimentos', async (req, res) => {
// Depois:
app.get('/api/contatos/:canalCliente/atendimentos', authenticateToken, async (req, res) => {

// Antes: app.get('/api/atendimentos/:idAtendimento/mensagens', async (req, res) => {
// Depois:
app.get('/api/atendimentos/:idAtendimento/mensagens', authenticateToken, async (req, res) => {

// Antes: app.get('/api/atendimentos/:idAtendimento', async (req, res) => {
// Depois:
app.get('/api/atendimentos/:idAtendimento', authenticateToken, async (req, res) => {
```

### 2. FRONTEND - Criar Login.jsx

Criar arquivo: `/frontend/src/Login.jsx`

```javascript
import { useState } from 'react'
import axios from 'axios'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/login', { username, password })
      localStorage.setItem('token', response.data.token)
      onLogin(response.data.token)
    } catch (err) {
      setError('Usuário ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>WhatsApp Viewer</h1>
        <p>Faça login para acessar</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
```

### 3. FRONTEND - Criar Login.css

Criar arquivo: `/frontend/src/Login.css`

```css
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #128c7e 0%, #075e54 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-box h1 {
  text-align: center;
  color: #075e54;
  margin-bottom: 10px;
}

.login-box p {
  text-align: center;
  color: #667781;
  margin-bottom: 30px;
  font-size: 14px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #111b21;
  font-weight: 500;
  font-size: 14px;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus {
  border-color: #128c7e;
}

.login-box button {
  width: 100%;
  padding: 12px;
  background: #128c7e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 10px;
}

.login-box button:hover:not(:disabled) {
  background: #0f7a68;
}

.login-box button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}
```

### 4. FRONTEND - Modificar App.jsx

No início do componente, adicionar:

```javascript
import Login from './Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
      // Configurar axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  const handleLogin = (token) => {
    setIsAuthenticated(true)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Resto do código do App continua igual...
```

### 5. FRONTEND - Adicionar botão de logout

No header do App, adicionar:

```jsx
<header className="app-header">
  <div className="header-content">
    <div>
      <h1>WhatsApp Viewer</h1>
      <p>Visualizador de Atendimentos</p>
    </div>
    <button onClick={handleLogout} className="btn-logout">
      Sair
    </button>
  </div>
</header>
```

### 6. CSS - Adicionar ao App.css:

```css
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-logout {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

## 📝 Credenciais

- **Usuário**: `primazzo`
- **Senha**: `primazzo2026`

## 🚀 Como Aplicar

1. Modificar server.js conforme instruções acima
2. Criar Login.jsx e Login.css
3. Modificar App.jsx
4. Reiniciar backend e frontend
5. Acessar aplicação - verá tela de login

