export type BadgeStatus = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeBaseConfig {
  status?: BadgeStatus
}

export interface LabelBadgeConfig extends BadgeBaseConfig {
  variant: 'label'
  label: string
}

export interface CountBadgeConfig extends BadgeBaseConfig {
  variant: 'count'
  value: number
  max?: number
  prefix?: string
  ariaLabel?: string
}

export interface DotBadgeConfig extends BadgeBaseConfig {
  variant: 'dot'
  ariaLabel: string
  pulse?: boolean
}

export type BadgeConfig = LabelBadgeConfig | CountBadgeConfig | DotBadgeConfig
