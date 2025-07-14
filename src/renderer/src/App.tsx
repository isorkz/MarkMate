import AppLayout from './components/layout/AppLayout'
import { Toaster } from 'react-hot-toast'
import './assets/globals.css'

function App(): React.JSX.Element {
  return (
    <>
      <AppLayout />
      <Toaster
        position="top-right"
        toastOptions={{
          // duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App
