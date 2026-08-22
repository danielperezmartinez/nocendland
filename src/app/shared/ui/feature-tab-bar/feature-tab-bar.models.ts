export interface FeatureTabItem<TId extends string = string> {
  id: TId
  label: string
  icon: string
  commands: readonly string[]
}
