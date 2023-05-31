import { Component, createSignal, Show } from 'solid-js'
import styles from './App.module.css'
import { CustomEmoji, EmojiPicker, EmojiWithIndex } from '../src'
import { emojis } from '../src/emojis'

const customEmojis: CustomEmoji[] = [
  {
    id: '1',
    name: 'lol',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '1',
      name: 'lol',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
      customElement(size) {
        return <div>Test</div>
      },
    },
  },
  {
    id: '2',
    name: 'cat',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '1',
      name: 'lol',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '3',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '2',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '3',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '3',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '4',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '3',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '5',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '3',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '6',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '3',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '7',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '3',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '8',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '3',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
  {
    id: '9',
    name: 'dog',
    url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    category: {
      id: '3',
      name: 'lol1',
      url: 'https://cdn.nerimity.com/emojis/1376182012704104448.webp',
    },
  },
]

const App: Component = () => {
  const [isShowing, setShowing] = createSignal(false)

  const onEmojiClick = (emoji: EmojiWithIndex | CustomEmoji) => {
    console.log(emoji)
  }

  return (
    <div class={styles.App}>
      <button style={{ position: 'absolute', left: 0 }} onClick={() => setShowing(!isShowing())}>
        Toggle
      </button>
      <Show when={isShowing()}>
        <EmojiPicker
          style={{ height: '400px' }}
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
