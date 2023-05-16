import { Component, createSignal, Show } from 'solid-js'
import styles from './App.module.css'
import { Emoji, EmojiPicker } from '../src'
import { emojis } from '../src/emojis'

interface CustomEmoji {
  id: string;
  name: string;
  url: string;
  category: {id: string; name: string, url: string};
}

const customEmojis: CustomEmoji[] = [
  { id: "1", name: "lol", url: "https://cdn.nerimity.com/emojis/1376182012704104448.webp", category: {id: "1", name: "lol", url: "https://cdn.nerimity.com/emojis/1376182012704104448.webp"} },
  { id: "2", name: "cat", url: "https://cdn.nerimity.com/emojis/1376182055343398912.webp", category: {id: "1", name: "lol", url: "https://cdn.nerimity.com/emojis/1376182012704104448.webp"} },
  { id: "3", name: "dog", url: "https://cdn.nerimity.com/emojis/1376182012704104448.webp", category: {id: "2", name: "lol1", url: "https://cdn.nerimity.com/emojis/1376182012704104448.webp"} },
  { id: "3", name: "dog", url: "https://cdn.nerimity.com/emojis/1376182012704104448.webp", category: {id: "3", name: "lol1", url: "https://cdn.nerimity.com/emojis/1376182012704104448.webp"} },
]

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
          customEmojis={customEmojis}
          emojis={emojis}
          primaryColor="red"
          spriteUrl="/emojiSprites.png"
        />
      </Show>
    </div>
  )
}

export default App
