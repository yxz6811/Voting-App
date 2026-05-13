import { useAuth } from './auth'
import { AppShell } from './components/AppShell'
import { LoggedInClassroom } from './components/LoggedInClassroom'
import { LoginForm } from './components/LoginForm'
import './App.css'

function App() {
  const { user, hydrated } = useAuth()

  if (!hydrated) {
    return <div className="auth-boot" aria-busy="true" />
  }

  if (user == null) {
    return <LoginForm />
  }

  return (
    <AppShell>
      <LoggedInClassroom />
    </AppShell>
  )
}

export default App
