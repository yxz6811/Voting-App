import { useAuth } from './auth'
import { AppShell } from './components/AppShell'
import { FeedbackPage } from './components/FeedbackPage'
import { LoggedInClassroom } from './components/LoggedInClassroom'
import { LoginForm } from './components/LoginForm'
import { useHashRoute } from './hooks/useHashRoute'
import './App.css'

function App() {
  const { user, hydrated } = useAuth()
  const hashRoute = useHashRoute()

  if (!hydrated) {
    return <div className="auth-boot" aria-busy="true" />
  }

  if (user == null) {
    return <LoginForm />
  }

  return (
    <AppShell>
      {hashRoute === 'feedback' ? <FeedbackPage /> : <LoggedInClassroom />}
    </AppShell>
  )
}

export default App
