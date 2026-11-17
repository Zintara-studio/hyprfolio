import { useState } from 'react'
import { BootScreen } from './components/BootScreen'
import { Desktop } from './components/Desktop'

export default function App() {
  const [booted, setBooted] = useState(false)
  return booted ? <Desktop /> : <BootScreen onDone={() => setBooted(true)} />
}
