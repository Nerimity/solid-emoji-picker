<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-emoji-picker&background=tiles&project=%20" alt="solid-emoji-picker">
</p>

# solid-emoji-picker

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

SolidJS Emoji Picker modal.

## Quick start

Install it:

```bash
npm i solid-emoji-picker
# or
pnpm add solid-emoji-picker
```

Use it:

```tsx
import { EmojiPicker } from 'solid-emoji-picker';
import { emojis } from 'solid-emoji-picker/emojis';
import { categories } from 'solid-emoji-picker/categories';


const App = () => {
  return (
    <div>
      <EmojiPicker spriteUrl="/emojiSprites.png" categories={categories} emojis={emojis} />
    </div>
  )
}

export default App
```

## Events
```js
onEmojiClicked: (Emoji) => void;
```
## Properties
```js
primaryColor = "#77a8f3"
categories = string[]
emojis = Emoji[]
maxRow = 7
spriteUrl = "/emojiSprites.png" // located in dev/public/
```

## Emoji
```json
{
    "emoji": "😀",
    "short_names": ["grinning"],
    "category": "Smileys & Emotion"
}
```