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
import { VirtualContainer } from '@minht11/solid-virtual-container'

export interface Emoji {
  emoji: string
  short_names: string[]
  category: string
}

export type EmojiWithIndex = Emoji & { index: number }

export interface CustomEmoji {
  id: string
  name: string
  url: string
  category: CustomEmojiCategory
}

export interface CustomEmojiCategory {
  id: string
  name: string
  url: string
  type?: 'category'
}

export interface Category {
  name: string
  index: number
  type?: 'category'
}

const SIZE = 40

const [virtualizedEmojis, setVirtualizedEmojis] = createSignal<
  (EmojiWithIndex | CustomEmoji | CustomEmojiCategory | Category)[][]
>([])
const [categoryPositions, setCategoryPositions] = createSignal<
  [number, CustomEmojiCategory | Category][]
>([])

function generateCustomEmojiList(emojis: CustomEmoji[], MAX_ROW = 7) {
  let tempVirtualizedEmojis: (CustomEmoji | CustomEmojiCategory)[][] = []
  let tempCategoryPositions: [number, CustomEmojiCategory][] = []
  let tempCategories: CustomEmojiCategory[] = []

  let categoryIndex = -1
  let columnIndex = 0

  for (let index = 0; index < emojis.length; index++) {
    const emoji = emojis[index]
    if (!emoji) continue
    const category = { ...emoji.category, type: 'category' as 'category' }

    let tempCategoryIndex = tempCategories.findIndex(t => t.id === category.id)

    if (tempCategoryIndex < 0) {
      tempCategories.push(category)
      tempCategoryIndex = tempCategories.length - 1
    }

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

      tempVirtualizedEmojis[columnIndex]!.push(category)
      tempCategoryPositions.push([(tempVirtualizedEmojis.length - 1) * SIZE, category])

      columnIndex++

      tempVirtualizedEmojis[columnIndex] = []
    }

    tempVirtualizedEmojis[columnIndex]!.push(emoji)
    if (tempVirtualizedEmojis[columnIndex]?.length! > MAX_ROW) {
      columnIndex++
    }
  }

  setCategoryPositions(tempCategoryPositions)
  setVirtualizedEmojis(tempVirtualizedEmojis)
}

function generateList(emojis: Emoji[], MAX_ROW = 7) {
  let categoryIndex = -1
  let columnIndex = 0

  let tempVirtualizedEmojis: (EmojiWithIndex | Category)[][] = []
  let tempCategoryPositions: [number, Category][] = []
  let tempCategories: string[] = []

  for (let index = 0; index < emojis.length; index++) {
    const emoji = emojis[index]
    if (!emoji) continue
    let tempCategoryIndex = tempCategories.indexOf(emoji.category)

    if (tempCategoryIndex < 0) {
      tempCategories.push(emoji.category)
      tempCategoryIndex = tempCategories.length - 1
    }

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

      const category = { name: emoji.category, index, type: 'category' as const }
      tempVirtualizedEmojis[columnIndex]!.push(category)
      tempCategoryPositions.push([
        (virtualizedEmojis().length + (tempVirtualizedEmojis.length - 1)) * SIZE,
        category,
      ])

      columnIndex++

      tempVirtualizedEmojis[columnIndex] = []
    }

    tempVirtualizedEmojis[columnIndex]!.push({ ...emoji, index })
    if (tempVirtualizedEmojis[columnIndex]?.length! > MAX_ROW) {
      columnIndex++
    }
  }

  setVirtualizedEmojis([...virtualizedEmojis(), ...tempVirtualizedEmojis])
  setCategoryPositions([...categoryPositions(), ...tempCategoryPositions])
}

export interface EmojiPickerProps {
  primaryColor?: string
  emojis?: Emoji[]
  customEmojis?: CustomEmoji[]
  onEmojiClick?: (emoji: EmojiWithIndex | CustomEmoji) => void
  maxRow?: number
  spriteUrl: string
  class?: string
  style?: JSX.CSSProperties
}

const EmojiPickerContainer = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  height: 350px;
  width: 400px;
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
  return [...categoryPositions()].reverse().find(position => {
    return scrollTop >= position[0]
  })?.[1]
}

export const EmojiPicker: Component<EmojiPickerProps> = props => {
  let [scrollElement, setScrollElement] = createSignal<HTMLDivElement | undefined>()
  let [category, setCategory] = createSignal<CustomEmojiCategory | Category>()

  createEffect(
    on([() => props.emojis], () => {
      props.customEmojis?.length && generateCustomEmojiList(props.customEmojis!, props.maxRow)
      props.emojis?.length && generateList(props.emojis!, props.maxRow)

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
        <Categories
          mainProps={props}
          scrollElement={scrollElement()}
          selectedCategory={category()}
        />
        <Emojis onEmojiClick={props.onEmojiClick} mainProps={props} ref={setScrollElement} />
      </EmojiPickerContainer>
    </ThemeProvider>
  )
}

const CategoriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 5px;
  overflow: auto;
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 2px;

  &::-webkit-scrollbar {
    display: none;
  }
`

const CategoryContainer = styled.button<{ selected: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: none;

  aspect-ratio: 1/1;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;

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
  selectedCategory?: CustomEmojiCategory | Category
  mainProps: EmojiPickerProps
}) => {
  const spriteUrl = props.mainProps.spriteUrl

  const scrollTo = (category: CustomEmojiCategory | Category) => {
    const position = categoryPositions().find(position => {
      if (category.id) {
        return category.id === position[1].id
      }
      return category.name === position[1].name
    })?.[0]
    if (position === undefined) return
    props.scrollElement?.scrollTo({ top: position })
  }

  const Category = (props: {
    index: number
    category: { name: string; index: string } | CustomEmojiCategory
    selectedCategory?: string
  }) => {
    const selected = () => {
      if (props.selectedCategory?.id) {
        return props.selectedCategory?.id === props.category?.id
      }
      return props.selectedCategory?.name === props.category?.name
    }

    return (
      <CategoryContainer
        class="categoryContainer"
        onclick={() => scrollTo(props.category)}
        selected={selected()}
        title={props.category?.name}
      >
        <EmojiImage size={25} index={props.category.index} url={props.category.url || spriteUrl} />
      </CategoryContainer>
    )
  }

  return (
    <CategoriesContainer class="categoriesContainer">
      <For each={categoryPositions()}>
        {([, category], index) => (
          <Category index={index()} selectedCategory={props.selectedCategory} category={category} />
        )}
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
  gap: 5px;
  align-items: center;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.12);
  flex: 1;
  padding-left: 6px;
  border-radius: 6px;
  height: 25px;
  align-self: center;
  margin-right: 5px;
`

const ROWS = 40
const Emojis = (props: {
  ref: any
  onEmojiClick?: (emoji: Emoji) => void
  mainProps: EmojiPickerProps
}) => {
  const onClick = props.onEmojiClick
  const spriteUrl = props.mainProps.spriteUrl

  const Emoji = (props: { emoji: EmojiWithIndex; children?: JSXElement }) => {
    return (
      <EmojiContainer
        class="emojiContainer"
        title={props.emoji.name || props.emoji.short_names[0]}
        onclick={() => onClick?.(props.emoji)}
      >
        <EmojiImage
          index={props.emoji.url ? undefined : props.emoji.index}
          url={props.emoji.url || spriteUrl}
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
    <div
      class={emojisContainerStyles}
      classList={{ emojisContainer: true }}
      ref={scrollTargetElement}
    >
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
                  <Match when={emoji.type === 'category'}>
                    <Title class="title">
                      <EmojiImage
                        size={15}
                        index={emoji.url ? undefined : emoji.index}
                        url={emoji.url || spriteUrl}
                      />
                      <span>{emoji.name}</span>
                    </Title>
                  </Match>
                  <Match when={emoji.type !== 'category'}>
                    <Emoji emoji={emoji as EmojiWithIndex} />
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

function EmojiImage(props: { size?: number; url: string; index?: number }) {
  let styles = () => {
    props.size = props.size || 30
    const properties: JSX.CSSProperties = {
      'background-image': `url(${props.url})`,
      height: props.size + 'px',
      width: props.size + 'px',
      'background-size': 'contain',
      'background-repeat': 'no-repeat',
    }
    if (props.index !== undefined) {
      const currentRow = props.index % ROWS
      const currentColumn = Math.floor(props.index / ROWS)
      properties['background-position'] = `${-(currentRow * props.size)}px ${-(
        currentColumn * props.size
      )}px`
      properties['background-size'] = 40 * props.size + 'px'
    }
    return properties
  }

  return (
    <div
      style={styles()}
      class="emojiImage"
      classList={{ customEmojiImage: props.index === undefined }}
    />
  )
}
