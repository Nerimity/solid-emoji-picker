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
  Show,
  batch,
  useTransition,
  createRenderEffect,
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
  url?: string
  customElement?: (size: number) => JSXElement
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
  const [scrollElement, setScrollElement] = createSignal<HTMLDivElement | undefined>()
  const [category, setCategory] = createSignal<CustomEmojiCategory | Category>()


  createRenderEffect(
    on([() => props.emojis, () => props?.customEmojis, () => props.maxRow], () => {
      setCategoryPositions([])
      setVirtualizedEmojis([])
      props.customEmojis?.length && generateCustomEmojiList(props.customEmojis!, props.maxRow)
      props.emojis?.length && generateList(props.emojis!, props.maxRow)
    }),
  )

  onCleanup(() => {
    setCategoryPositions([])
    setVirtualizedEmojis([])
  })

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

  const scrollTo = (category: CustomEmojiCategory & Category) => {
    const position = categoryPositions().find(position => {
      if (category.id) {
        return category.id === (position[1] as CustomEmojiCategory).id
      }
      return category.name === position[1].name
    })?.[0]
    if (position === undefined) return
    props.scrollElement?.scrollTo({ top: position })
  }

  const Category = (props: {
    index: number
    category: Category & CustomEmojiCategory
    selectedCategory?: CustomEmojiCategory & Category
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
        <Show when={props.category.customElement}>{props.category.customElement!(25)}</Show>
        <Show when={!props.category.customElement}>
          <EmojiImage
            size={25}
            index={props.category.index}
            url={props.category.url || spriteUrl}
          />
        </Show>
      </CategoryContainer>
    )
  }

  return (
    <CategoriesContainer class="categoriesContainer">
      <For each={categoryPositions()}>
        {([, category], index) => (
          <Category
            index={index()}
            selectedCategory={props.selectedCategory as Category & CustomEmojiCategory}
            category={category as Category & CustomEmojiCategory}
          />
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
  onEmojiClick?: (emoji: EmojiWithIndex & CustomEmoji) => void
  mainProps: EmojiPickerProps
}) => {
  const onClick = props.onEmojiClick
  const spriteUrl = props.mainProps.spriteUrl
  const [hoveredEmoji, setHoveredEmoji] = createSignal<(CustomEmoji & EmojiWithIndex) | undefined>(
    undefined,
  )

  const Emoji = (props: { emoji: EmojiWithIndex & CustomEmoji; children?: JSXElement }) => {
    return (
      <EmojiContainer
        class="emojiContainer"
        title={props.emoji.name || props.emoji.short_names[0]}
        onclick={() => onClick?.(props.emoji)}
        onMouseEnter={() => setHoveredEmoji(props.emoji)}
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
      <SearchBar/>
      <VirtualContainer
        scrollTarget={scrollTargetElement}
        items={virtualizedEmojis()}
        itemSize={{ height: SIZE }}
      >
        {props => (
          <div style={{ ...props.style, display: 'flex', width: '100%' }}>
            <For each={props.item}>
              {emoji => (
                <Switch>
                  <Match when={(emoji as Category).type === 'category'}>
                    <Title class="title">
                      <Show when={!(emoji as CustomEmojiCategory).customElement}>
                        <EmojiImage
                          size={15}
                          index={
                            (emoji as CustomEmojiCategory).url
                              ? undefined
                              : (emoji as Category).index
                          }
                          url={(emoji as CustomEmojiCategory).url || spriteUrl}
                        />
                      </Show>
                      <Show when={(emoji as CustomEmojiCategory).customElement}>
                        {(emoji as CustomEmojiCategory).customElement!(15)}
                      </Show>
                      <span>{(emoji as CustomEmojiCategory).name}</span>
                    </Title>
                  </Match>
                  <Match when={(emoji as CustomEmojiCategory).type !== 'category'}>
                    <Emoji emoji={emoji as CustomEmoji & EmojiWithIndex} />
                  </Match>
                </Switch>
              )}
            </For>
          </div>
        )}
      </VirtualContainer>
      <Show when={hoveredEmoji()}>
        <HoveredEmojiDetails mainProps={props.mainProps} emoji={hoveredEmoji()!} />
      </Show>
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

const HoveredEmojiDetailsContainer = styled('div')`
  display: flex;
  gap: 10px;
  align-items: center;
  position: sticky;
  bottom: 0;
  background-color: rgba(99, 99, 99, 0.4);
  padding: 5px;
  backdrop-filter: blur(20px);
  border-radius: 8px;
  width: calc(100% - 15px);

  .details {
  }
  .name {
    font-size: 14px;
  }
  .category {
    font-size: 12px;
    opacity: 0.6;
  }
`

function HoveredEmojiDetails(props: {
  mainProps: EmojiPickerProps
  emoji: CustomEmoji & EmojiWithIndex
}) {
  const spriteUrl = props.mainProps.spriteUrl

  return (
    <HoveredEmojiDetailsContainer>
      <EmojiImage
        index={props.emoji.url ? undefined : props.emoji.index}
        url={props.emoji.url || spriteUrl}
      />
      <div class="details">
        <div class="name">{props.emoji.name || props.emoji.short_names[0]}</div>
        <div class="category">{props.emoji.category.name || props.emoji.category}</div>
      </div>
    </HoveredEmojiDetailsContainer>
  )
}





const SearchBarContainer = styled('div')`
  display: flex;
  gap: 10px;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: rgba(99, 99, 99, 0.4);
  backdrop-filter: blur(20px);
  border-radius: 6px;
  width: calc(100% - 5px);
  z-index: 1;
  
  input {
    padding: 10px;
    background-color: transparent;
    color: white;
    border: none;
    width: 100%;
    outline: none;
  }
`

function SearchBar(props: {}) {

  return (
    <SearchBarContainer>
      <input type="text" placeholder='Search' />
    </SearchBarContainer>
  )
}