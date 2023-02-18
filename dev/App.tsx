import { Component, createSignal, Show } from 'solid-js'
import styles from './App.module.css'
import { Emoji, EmojiPicker } from '../src'
import { emojis } from '../src/emojis'
import { categories } from '../src/categories'

const App: Component = () => {
  const [isShowing, setShowing] = createSignal(false)

  const onEmojiClick = (emoji: Emoji) => {
    console.log(emoji)
  }

  return (
    <div class={styles.App}>
      <button style={{ position: 'absolute', left: 0 }} onClick={() => setShowing(!isShowing())}>
        Toggle
      </button>
      <Show when={isShowing()}>
        <EmojiPicker
          onEmojiClick={onEmojiClick}
          categories={categories}
          emojis={emojis}
          primaryColor="red"
          spriteUrl="/emojiSprites.png"
        />
      </Show>
    </div>
  )
}

export default App
