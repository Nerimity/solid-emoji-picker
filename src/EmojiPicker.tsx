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
import { matchSorter } from 'match-sorter'

function RecentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="20px"
      viewBox="0 0 24 24"
      width="20px"
      fill="white"
    >
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z" />
    </svg>
  )
}

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
      tempCategoryPositions.push([
        (virtualizedEmojis().length + (tempVirtualizedEmojis.length - 1)) * SIZE,
        category,
      ])

      columnIndex++

      tempVirtualizedEmojis[columnIndex] = []
    }

    tempVirtualizedEmojis[columnIndex]!.push(emoji)
    if (tempVirtualizedEmojis[columnIndex]?.length! > MAX_ROW) {
      columnIndex++
    }
  }

  setVirtualizedEmojis([...virtualizedEmojis(), ...tempVirtualizedEmojis])
  setCategoryPositions([...categoryPositions(), ...tempCategoryPositions])
}

function generateList(emojis: EmojiWithIndex[], MAX_ROW = 7) {
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

    tempVirtualizedEmojis[columnIndex]!.push(emoji)
    if (tempVirtualizedEmojis[columnIndex]?.length! > MAX_ROW) {
      columnIndex++
    }
  }

  setVirtualizedEmojis([...virtualizedEmojis(), ...tempVirtualizedEmojis])
  setCategoryPositions([...categoryPositions(), ...tempCategoryPositions])
}

function generateSearchList(
  emojis: EmojiWithIndex[],
  customEmojis: CustomEmoji[],
  search: string,
  MAX_ROW = 7,
) {
  const searchedEmojis = matchSorter([...customEmojis, ...emojis], search, {
    keys: ['short_names.*', 'name'],
  })

  let columnIndex = 0
  let tempVirtualizedEmojis: (EmojiWithIndex | CustomEmoji)[][] = []

  for (let i = 0; i < searchedEmojis.length; i++) {
    const emoji = searchedEmojis[i]

    if (!tempVirtualizedEmojis[columnIndex]) {
      tempVirtualizedEmojis[columnIndex] = []
    }

    tempVirtualizedEmojis[columnIndex]!.push(emoji!)
    if (tempVirtualizedEmojis[columnIndex]?.length! > MAX_ROW) {
      columnIndex++
    }
  }
  setVirtualizedEmojis(tempVirtualizedEmojis)
}

function generateRecentEmojiList(emojis: (EmojiWithIndex | CustomEmoji)[], MAX_ROW = 7) {
  let columnIndex = 0
  let tempVirtualizedEmojis: (EmojiWithIndex | CustomEmoji | CustomEmojiCategory)[][] = []

  const category: CustomEmojiCategory = {
    id: 'recent',
    name: 'Recent Emojis',
    type: 'category',
    customElement: () => <RecentIcon />,
  }

  setCategoryPositions([[0, category]])
  tempVirtualizedEmojis[columnIndex] = [category]
  columnIndex++
  for (let i = 0; i < emojis.length; i++) {
    const emoji = emojis[i]

    if (!tempVirtualizedEmojis[columnIndex]) {
      tempVirtualizedEmojis[columnIndex] = []
    }

    tempVirtualizedEmojis[columnIndex]!.push(emoji!)
    if (tempVirtualizedEmojis[columnIndex]?.length! > MAX_ROW) {
      columnIndex++
    }
  }
  setVirtualizedEmojis(tempVirtualizedEmojis)
}

export interface EmojiPickerProps {
  primaryColor?: string
  emojis?: Emoji[]
  customEmojis?: CustomEmoji[]
  onEmojiClick?: (emoji: EmojiWithIndex | CustomEmoji) => void
  maxRow?: number
  maxRecent?: number
  spriteUrl: string
  class?: string
  style?: JSX.CSSProperties
  focusOnMount?: boolean
}

const EmojiPickerContainer = styled.div`
  position: relative;
  display: flex;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  height: 350px;
  width: 400px;
  border: solid 1px rgba(255, 255, 255, 0.3);
  color: white;
  overflow: hidden;
  z-index: 1;
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
  const [search, setSearch] = createSignal('')

  const emojisWithIndex = props.emojis?.map((e, i) => ({ ...e, index: i }))

  const recentEmojis = getHistory()
    .map(shortName => {
      const emoji = emojisWithIndex?.find(e => e.short_names[0] === shortName)
      if (emoji) return emoji
      const customEmoji = props.customEmojis?.find(e => e.name === shortName)
      if (customEmoji) return customEmoji
    })
    .filter(e => e)

  createRenderEffect(
    on([() => props.emojis, () => props?.customEmojis, () => props.maxRow, search], () => {
      if (search())
        return generateSearchList(
          emojisWithIndex || [],
          props.customEmojis || [],
          search(),
          props.maxRow,
        )
      setCategoryPositions([])
      setVirtualizedEmojis([])
      recentEmojis.length &&
        generateRecentEmojiList(recentEmojis as (EmojiWithIndex | CustomEmoji)[], props.maxRow)
      props.customEmojis?.length && generateCustomEmojiList(props.customEmojis!, props.maxRow)
      emojisWithIndex?.length && generateList(emojisWithIndex!, props.maxRow)
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

  const onEmojiClick = (emoji: EmojiWithIndex & CustomEmoji) => {
    addToHistory(emoji.name || emoji.short_names[0]!, props.maxRecent || 10)
    props.onEmojiClick?.(emoji)
  }

  return (
    <ThemeProvider theme={theme}>
      <EmojiPickerContainer class={props.class} style={props.style}>
        <Categories
          onCategoryClick={() => setSearch('')}
          mainProps={props}
          scrollElement={scrollElement()}
          selectedCategory={category()}
        />
        <Emojis
          onSearchInput={setSearch}
          searchValue={search()}
          onEmojiClick={onEmojiClick}
          mainProps={props}
          ref={setScrollElement}
        />
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
  z-index: 1;

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
  onCategoryClick(): void
  mainProps: EmojiPickerProps
}) => {
  const spriteUrl = props.mainProps.spriteUrl

  const scrollTo = (category: CustomEmojiCategory & Category) => {
    props.onCategoryClick()
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
  flex-direction: column;
  margin: 5px;
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
  onSearchInput: (value: string) => void
  searchValue: string
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
      <SearchBar autoFocus={props.mainProps.focusOnMount} onText={props.onSearchInput} value={props.searchValue} />
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
  margin-top: auto;
  gap: 10px;
  align-items: center;
  position: sticky;
  bottom: 0;
  background-color: rgba(99, 99, 99, 0.4);
  padding: 5px;
  backdrop-filter: blur(20px);
  border-radius: 8px;
  width: calc(100% - 15px);
  border: solid 1px rgba(255, 255, 255, 0.2);

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
        <div class="name">{props.emoji.name || props.emoji.short_names.join(' ')}</div>
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
  border: solid 1px rgba(255, 255, 255, 0.2);
  border-bottom: solid 2px ${props => props.theme?.primary};
  input {
    padding: 10px;
    background-color: transparent;
    color: white;
    border: none;
    width: 100%;
    outline: none;
  }
`

function SearchBar(props: { autoFocus?: boolean; value: string; onText(value: string): void }) {
  let inputRef: HTMLInputElement | undefined
  onMount(() => {
    if (props.autoFocus === false) return;
    inputRef?.focus()
  })
  return (
    <SearchBarContainer>
      <input
        ref={inputRef}
        type="text"
        value={props.value}
        placeholder="Search"
        onInput={event => props.onText(event.target.value)}
      />
    </SearchBarContainer>
  )
}

export function addToHistory(name: string, maxRecent: number) {
  let history = getHistory()
  // remove if already exists
  history = history.filter(hn => hn !== name)

  history.unshift(name)
  localStorage['nerimity-solid-emoji-pane'] = JSON.stringify(history.splice(0, maxRecent))
}

export function getHistory(): string[] {
  return JSON.parse(localStorage['nerimity-solid-emoji-pane'] || '[]')
}
