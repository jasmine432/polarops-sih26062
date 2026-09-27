import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { OperationalProvider } from './context/OperationalContext'

function App() {
  return (
    <OperationalProvider>
      <RouterProvider router={router} />
    </OperationalProvider>
  )
}

export default App
