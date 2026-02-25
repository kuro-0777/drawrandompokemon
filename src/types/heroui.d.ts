declare module '@heroui/react' {
  import * as React from 'react'
  export const HeroUIProvider: React.FC<any>
  export const Button: React.FC<any>
  export const ColorPicker: React.FC<any>
  export const Slider: React.FC<any>
  export const Alert: React.FC<any>
  export const Card: React.FC<any>
  export const CardBody: React.FC<any>
  const _default: any
  export default _default
}

declare module '@heroui/theme' {
  const plugin: any
  export default plugin
}

declare module 'shadcn' {
  import * as React from 'react'
  export const ColorPicker: React.FC<any>
  const _default: any
  export default _default
}

declare module '@heroui/popover' {
  import * as React from 'react'
  export const Popover: React.FC<any>
  export const PopoverTrigger: React.FC<any>
  export const PopoverContent: React.FC<any>
  const _default: any
  export default _default
}
