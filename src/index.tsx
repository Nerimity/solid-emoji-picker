import { Component, For, Match, Switch } from 'solid-js'
import { css, styled } from 'solid-styled-components'
import categories from './categories.json'
import emojis from './emojis.json'
import { VirtualContainer } from '@minht11/solid-virtual-container'

type Emoji = (typeof emojis)[0]
const MAX_ROW = 10
let currentIndex = -1

let columnIndex = -1

const virtualizedEmojis: (Emoji | string)[][] = []

for (let index = 0; index < emojis.length; index++) {
  const emoji = emojis[index]
  if (!emoji) continue
  const categoryIndex = categories.findIndex(name => name === emoji.category)
  if (index % MAX_ROW === 0) {
    columnIndex++
  }

  if (!virtualizedEmojis[columnIndex]) {
    virtualizedEmojis[columnIndex] = []
  }

  if (currentIndex !== categoryIndex) {
    currentIndex = categoryIndex
    virtualizedEmojis[columnIndex]!.push(emoji.category)
  }

  virtualizedEmojis[columnIndex]!.push(emoji)
}

export interface EmojiPickerProps {}

const EmojiPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  height: 300px;
  width: 350px;
  border: solid 1px rgba(255, 255, 255, 0.3);
  color: white;
  overflow: hidden;
`

export const EmojiPicker: Component<EmojiPickerProps> = props => {
  return (
    <EmojiPickerContainer>
      <Categories />
      <Emojis />
    </EmojiPickerContainer>
  )
}

const CategoriesContainer = styled.div`
  display: flex;
  gap: 3px;
  margin: 5px;
`

const CategoryContainer = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none;

  aspect-ratio: 1/1;
  flex: 1;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

const Categories = () => {
  const Category = (props: { name: string }) => {
    return <CategoryContainer>{props.name[0]}</CategoryContainer>
  }

  return (
    <CategoriesContainer>
      <For each={categories}>{name => <Category name={name} />}</For>
    </CategoriesContainer>
  )
}

const emojisContainerStyles = css`
  display: flex;
  margin: 5px;
  flex-wrap: wrap;
  overflow: auto;
  flex: 1;
`

const EmojiContainer = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none;

  aspect-ratio: 1/1;
  flex: 1;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  height: 40px;
  width: 40px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

const Emojis = () => {
  const Emoji = (props: { emoji: any }) => {
    return <EmojiContainer>{props.emoji.emoji}</EmojiContainer>
  }

  let scrollTargetElement
  // VirtualContainer does not seem to work with styled components
  return (
    <div class={emojisContainerStyles} ref={scrollTargetElement}>
      <VirtualContainer
        scrollTarget={scrollTargetElement}
        items={virtualizedEmojis}
        itemSize={{ height: 40 }}
      >
        {props => <div style={props.style}>test</div>}
      </VirtualContainer>
    </div>
  )
}
