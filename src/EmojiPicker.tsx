import {
  Component,
  For,
  Match,
  Switch,
  onMount,
  createSignal,
  createEffect,
  JSXElement,
  onCleanup,
  on,
  JSX,
} from 'solid-js'
import { css, styled, ThemeProvider } from 'solid-styled-components'

import type { emojis as EmojisType } from './emojis'

import { VirtualContainer } from '@minht11/solid-virtual-container'

export type Emoji = (typeof EmojisType)[0] & { index: number }

const SIZE = 40

const [virtualizedEmojis, setVirtualizedEmojis] = createSignal<(Emoji | string)[][]>([])
const [categoryPositions, setCategoryPositions] = createSignal<[number, string][]>([])

function generateList(emojis: Emoji[], categories: string[], MAX_ROW = 7) {
  let categoryIndex = -1
  let columnIndex = 0

  let tempVirtualizedEmojis: (Emoji | string)[][] = []
  let tempCategoryPositions: [number, string][] = []

  for (let index = 0; index < emojis.length; index++) {
    const emoji = emojis[index]
    if (!emoji) continue
    const tempCategoryIndex = categories.findIndex(name => name === emoji.category)

    if (!tempVirtualizedEmojis[columnIndex]) {
      tempVirtualizedEmojis[columnIndex] = []
    }

    if (categoryIndex !== tempCategoryIndex) {
      categoryIndex = tempCategoryIndex
      if (index !== 0) {
        if (tempVirtualizedEmojis[columnIndex]?.length) {
          columnIndex++
        }
        tempVirtualizedEmojis[columnIndex] = []
      }
      tempVirtualizedEmojis[columnIndex]!.push(emoji.category)
      columnIndex++

      tempVirtualizedEmojis[columnIndex] = []
    }

    tempVirtualizedEmojis[columnIndex]!.push({ ...emoji, index })
    if (tempVirtualizedEmojis[columnIndex]?.length! > MAX_ROW) {
      columnIndex++
    }
  }

  for (let index = 0; index < tempVirtualizedEmojis.length; index++) {
    const emoji = tempVirtualizedEmojis[index]?.[0]
    if (typeof emoji === 'string') {
      tempCategoryPositions.push([index * SIZE, emoji])
    }
  }
  setVirtualizedEmojis(tempVirtualizedEmojis)
  setCategoryPositions(tempCategoryPositions)
}

export interface EmojiPickerProps {
  primaryColor?: string
  customHandler?: (emoji: Emoji) => JSXElement
  categories?: string[]
  emojis?: Emoji[]
  onEmojiClick?: (emoji: Emoji) => void
  maxRow?: number
  spriteUrl: string
  class?: string
  style?: JSX.CSSProperties
}

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

function debounce(func: any, wait: number) {
  let timeout: number
  return () => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(func, wait)
  }
}

const currentCategory = (scrollTop: number) => {
  return [...categoryPositions()].reverse().find(position => scrollTop >= position[0])?.[1]
}

export const EmojiPicker: Component<EmojiPickerProps> = props => {
  let [scrollElement, setScrollElement] = createSignal<HTMLDivElement | undefined>()
  let [category, setCategory] = createSignal<string>()

  createEffect(
    on([() => props.emojis, () => props.categories], () => {
      generateList(props.emojis!, props.categories!, props.maxRow)

      onCleanup(() => {
        setCategoryPositions([])
        setVirtualizedEmojis([])
      })
    }),
  )

  createEffect(() => {
    scrollElement()?.addEventListener('scroll', onScroll)
    setCategory(currentCategory(scrollElement()?.scrollTop!))

    onCleanup(() => {
      scrollElement()?.removeEventListener('scroll', onScroll)
    })
  })

  const onScroll = debounce(() => {
    setCategory(currentCategory(scrollElement()?.scrollTop!))
  }, 50)

  const theme = {
    primary: props.primaryColor || '#77a8f3',
  }

  return (
    <ThemeProvider theme={theme}>
      <EmojiPickerContainer class={props.class} style={props.style}>
        <Categories scrollElement={scrollElement()} selectedCategory={category()} />
        <Emojis onEmojiClick={props.onEmojiClick} mainProps={props} ref={setScrollElement} />
      </EmojiPickerContainer>
    </ThemeProvider>
  )
}

const CategoriesContainer = styled.div`
  display: flex;
  gap: 3px;
  margin: 5px;
`

const CategoryContainer = styled.button<{ selected: boolean }>`
  position: relative;
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

  ${props =>
    props.selected
      ? `
    &:before {
      position: absolute;
      content: '';
      width: 15px;
      height: 3px;
      background: ${props.theme?.primary};
      bottom: 0;
      border-radius: 8px;

    }
  
  `
      : ''}
`

const Categories = (props: {
  scrollElement: HTMLDivElement | undefined
  selectedCategory?: string
}) => {
  const scrollTo = (name: string) => {
    const position = categoryPositions().find(position => position[1] === name)?.[0]
    if (position === undefined) return
    props.scrollElement?.scrollTo({ top: position })
  }
  const Category = (props: { name: string; selectedCategory?: string }) => {
    return (
      <CategoryContainer
        onclick={() => scrollTo(props.name)}
        selected={props.selectedCategory === props.name}
      >
        {props.name[0]}
      </CategoryContainer>
    )
  }

  return (
    <CategoriesContainer>
      <For each={categoryPositions()}>
        {([, name]) => <Category selectedCategory={props.selectedCategory} name={name} />}
      </For>
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

const EmojiContainer = styled.div<{ url?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none;
  aspect-ratio: 1/1;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  height: 40px;
  width: 40px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;
  margin-left: 5px;
  color: rgba(255, 255, 255, 0.7);
`

const ROWS = 40
const Emojis = (props: {
  ref: any
  onEmojiClick?: (emoji: Emoji) => void
  mainProps: EmojiPickerProps
}) => {
  const onClick = props.onEmojiClick
  const spriteUrl = props.mainProps.spriteUrl

  const Emoji = (props: { emoji: Emoji; children?: JSXElement }) => {
    const currentColumn = Math.floor(props.emoji.index / ROWS)
    const currentRow = props.emoji.index % ROWS

    return (
      <EmojiContainer title={props.emoji.short_names[0]} onclick={() => onClick?.(props.emoji)}>
        <div
          style={{
            'background-image': `url(${spriteUrl})`,
            height: '30px',
            width: '30px',
            'background-size': '1200px',
            'background-repeat': 'no-repeat',
            'background-position': `${-(currentRow * 30)}px ${-(currentColumn * 30)}px`,
          }}
        />
      </EmojiContainer>
    )
  }

  let scrollTargetElement: HTMLDivElement | undefined

  onMount(() => {
    props.ref(scrollTargetElement)
  })

  // VirtualContainer does not seem to work with styled components
  return (
    <div class={emojisContainerStyles} ref={scrollTargetElement}>
      <VirtualContainer
        scrollTarget={scrollTargetElement}
        items={virtualizedEmojis()}
        itemSize={{ height: SIZE }}
      >
        {props => (
          <div style={{ ...props.style, display: 'flex', width: '100%' }}>
            <For each={props.item}>
              {(emoji, i) => (
                <Switch>
                  <Match when={typeof emoji === 'string'}>
                    <Title>{emoji as string}</Title>
                  </Match>
                  <Match when={typeof emoji !== 'string'}>
                    <Emoji emoji={emoji as Emoji} />
                  </Match>
                </Switch>
              )}
            </For>
          </div>
        )}
      </VirtualContainer>
    </div>
  )
}
