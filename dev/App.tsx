import { Component, createSignal, Show } from 'solid-js'
import styles from './App.module.css'
import { EmojiPicker } from '../src'

const App: Component = () => {
  const [isShowing, setShowing] = createSignal(false)

  return (
    <div class={styles.App}>
      <button style={{ position: 'absolute', left: 0 }} onClick={() => setShowing(!isShowing())}>
        Toggle
      </button>
      <Show when={isShowing()}>
        <EmojiPicker />
      </Show>
    </div>
  )
}

export default App
